import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

    const invalidate = (keys: (string | (string | undefined)[])[]) => {
      for (const k of keys) {
        qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] });
      }
    };

    const channel = supabase
      .channel(`global-realtime-${userId}`)
      // Notifications — also covered by useNotifications, but kept as safety net
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => invalidate([["notifications"], ["admin-notifications"]]),
      )
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
            ["owner-rentals"],
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
            ["owner-rentals"],
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}