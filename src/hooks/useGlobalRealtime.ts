import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notifyFromDb } from "@/lib/notify";

/**
 * Track which notification IDs have already been surfaced as a toast in this
 * browser session, so we never show the same one twice — whether it arrived
 * via realtime INSERT or via the resilience poll below.
 */
const SHOWN_KEY = "rentli:shown-notifications";
function loadShown(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function persistShown(ids: Set<string>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const arr = Array.from(ids).slice(-200);
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}
type ToastableNotification = {
  id?: string;
  type: string;
  title_ro: string;
  title_en?: string | null;
  description_ro?: string | null;
  description_en?: string | null;
};
function showOnce(n: ToastableNotification, shown: Set<string>) {
  if (n.id && shown.has(n.id)) return;
  try {
    notifyFromDb(n);
  } catch (e) {
    console.error("notifyFromDb failed", e);
    return;
  }
  if (n.id) {
    shown.add(n.id);
    persistShown(shown);
  }
}

/**
 * Global realtime subscriptions for the signed-in user.
 * Invalidates relevant react-query caches so badges, counts, lists and
 * detail pages update without a manual refresh.
 *
 * Mount once near the top of the tree (e.g. inside <AuthProvider>).
 */
export function useGlobalRealtime(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const shown = loadShown();
    // Only surface notifications created shortly before / after mount, so
    // we don't re-toast historical rows on every page load. Realtime INSERTs
    // are still deduped through the same `shown` set.
    const since = new Date(Date.now() - 30_000).toISOString();

    const pollRecent = async (windowMs = 0) => {
      try {
        const cutoff = windowMs > 0
          ? new Date(Date.now() - windowMs).toISOString()
          : since;
        const { data, error } = await supabase
          .from("notifications")
          .select("id, type, title_ro, title_en, description_ro, description_en, created_at")
          .eq("user_id", userId)
          .eq("is_read", false)
          .gte("created_at", cutoff)
          .order("created_at", { ascending: true })
          .limit(20);
        if (error) {
          console.warn("[notifications-poll] error", error);
          return;
        }
        for (const n of data ?? []) showOnce(n as ToastableNotification, shown);
      } catch (e) {
        console.warn("[notifications-poll] failed", e);
      }
    };

    const invalidate = (keys: (string | (string | undefined)[])[]) => {
      for (const k of keys) {
        qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] });
      }
    };

    const channel = supabase
      .channel(`global-realtime-${userId}`)
      // Messaging
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as { conversation_id?: string };
          invalidate([
            ["conversations", userId],
            ["unread-messages", userId],
            ...(m.conversation_id ? [["messages", m.conversation_id]] : []),
          ]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => invalidate([["conversations", userId], ["unread-messages", userId]]),
      )
      // Rentals — as renter
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals", filter: `renter_id=eq.${userId}` },
        (payload) => {
          const r = (payload.new ?? payload.old) as { id?: string };
          invalidate([
            ["my-rentals"],
            ["myRentals"],
            ["owner-rentals"],
            ["ownerRentals"],
            ["account-dashboard"],
            ["earnings"],
            ["wallet-balance"],
            ...(r?.id ? [["rental", r.id], ["rental-payment-status", r.id]] : []),
          ]);
        },
      )
      // Rentals — as owner
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals", filter: `owner_id=eq.${userId}` },
        (payload) => {
          const r = (payload.new ?? payload.old) as { id?: string };
          invalidate([
            ["my-rentals"],
            ["myRentals"],
            ["owner-rentals"],
            ["ownerRentals"],
            ["account-dashboard"],
            ["earnings"],
            ["wallet-balance"],
            ...(r?.id ? [["rental", r.id], ["rental-payment-status", r.id]] : []),
          ]);
        },
      )
      // PV documents (handover / return) — useful on rental detail
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_pv_documents" },
        (payload) => {
          const d = (payload.new ?? payload.old) as { rental_id?: string };
          invalidate([
            ["my-rentals"],
            ["owner-rentals"],
            ...(d?.rental_id ? [["rental", d.rental_id], ["pv-progress", d.rental_id]] : []),
          ]);
        },
      )
      // Support tickets (user-visible)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tickets", filter: `user_id=eq.${userId}` },
        (payload) => {
          const t = (payload.new ?? payload.old) as { id?: string };
          invalidate([
            ["user-tickets"],
            ...(t?.id ? [["ticket", t.id]] : []),
          ]);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ops_ticket_messages" },
        (payload) => {
          const m = payload.new as { ticket_id?: string };
          invalidate([
            ["user-tickets"],
            ...(m?.ticket_id ? [["ticket-messages", m.ticket_id], ["ticket", m.ticket_id]] : []),
          ]);
        },
      )
      // Notifications — show a toast for every new row
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as ToastableNotification;
          console.log("[realtime] notification INSERT", n);
          invalidate([["notifications", userId]]);
          showOnce(n, shown);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Catch any events that fired between login and channel readiness
          // (RLS can drop INSERTs that arrive before realtime auth propagates).
          invalidate([
            ["conversations", userId],
            ["unread-messages", userId],
          ]);
          // Realtime sometimes drops INSERTs (Stripe redirect, tab wake,
          // RLS auth race). Fetch fresh unread notifications and surface
          // any we have not toasted yet.
          void pollRecent(60_000);
        }
      });

    // Periodic safety net so a missed websocket frame still surfaces within
    // ~10s. Dedup via the `shown` set guarantees no duplicate toast.
    const interval = window.setInterval(() => {
      void pollRecent();
    }, 10_000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [userId, qc]);

  // Resilience: refetch messaging + notification caches when the tab regains focus.
  useEffect(() => {
    if (!userId) return;

    const shown = loadShown();
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["conversations", userId] });
      qc.invalidateQueries({ queryKey: ["unread-messages", userId] });
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      // Also surface any toast we may have missed while the tab was hidden.
      const cutoff = new Date(Date.now() - 60_000).toISOString();
      supabase
        .from("notifications")
        .select("id, type, title_ro, title_en, description_ro, description_en, created_at")
        .eq("user_id", userId)
        .eq("is_read", false)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: true })
        .limit(20)
        .then(({ data }) => {
          for (const n of data ?? []) showOnce(n as ToastableNotification, shown);
        });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, qc]);
}