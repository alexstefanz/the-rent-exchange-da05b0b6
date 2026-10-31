import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRentalPopups,
  fetchRentalPopupById,
  markRenterConfirmationSeen,
  incrementOwnerPopupSeen,
  type RentalPopupItem,
} from "@/features/rentals/popupApi";
import { respondToRental } from "@/features/rentals/ownerRentalsApi";
import RentalRequestPopup from "./RentalRequestPopup";
import { useQueryClient } from "@tanstack/react-query";
import { categories } from "@/data/categories";

function resolveCategorySlug(input?: string | null): string | null {
  if (!input) return null;
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const target = norm(input);
  const direct = categories.find((c) => c.slug === target);
  if (direct) return direct.slug;
  const byName = categories.find(
    (c) => norm(c.name) === target || norm(c.nameEn) === target,
  );
  return byName ? byName.slug : null;
}

export default function RentalPopupManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<RentalPopupItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const redirectedRef = useRef<boolean>(false);

  const pushItem = (item: RentalPopupItem) => {
    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);
    // For renters: mark confirmation as seen the moment we display it,
    // so it never re-appears on next page load / realtime event.
    if (item.mode === "renter") {
      markRenterConfirmationSeen(item.id).catch(() => {});
    }
    // For owners: bump the displayed-count so it stops showing after 3 times.
    if (item.mode === "owner") {
      incrementOwnerPopupSeen(item.id).catch(() => {});
    }
    setQueue((q) => {
      if (q.some((x) => x.id === item.id)) return q;
      return [...q, item];
    });
  };

  const removeItem = (id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  };

  // Reset redirect flag when queue empties (new popup session can redirect again)
  useEffect(() => {
    if (queue.length === 0) {
      redirectedRef.current = false;
    }
  }, [queue.length]);

  // Initial fetch on login
  useEffect(() => {
    if (!user?.id) {
      setQueue([]);
      seenIdsRef.current.clear();
      return;
    }
    let cancelled = false;
    (async () => {
      const items = await fetchRentalPopups();
      if (cancelled) return;
      items.forEach(pushItem);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Realtime: new pending rentals where I'm owner, or my rentals becoming confirmed
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`rental-popups-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rentals", filter: `owner_id=eq.${user.id}` },
        async (payload: any) => {
          const row = payload.new;
          if (row?.status !== "pending") return;
          const item = await fetchRentalPopupById(row.id);
          if (item) pushItem(item);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `owner_id=eq.${user.id}` },
        (payload: any) => {
          const row = payload.new;
          // If a rental we may be displaying is no longer pending (renter cancelled,
          // or owner responded from another tab/device), remove it from the queue
          // so it can't be accepted from a stale popup.
          if (row?.id && row.status !== "pending") {
            removeItem(row.id);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `renter_id=eq.${user.id}` },
        async (payload: any) => {
          const row = payload.new;
          const old = payload.old;
          const becameConfirmed = row?.status === "confirmed" && old?.status !== "confirmed";
          const becameRejectedByOwner =
            row?.status === "cancelled" &&
            old?.status !== "cancelled" &&
            row?.cancelled_by &&
            row.cancelled_by === row.owner_id;
          if ((becameConfirmed || becameRejectedByOwner) && !row.renter_seen_confirmation) {
            const item = await fetchRentalPopupById(row.id);
            if (item) pushItem(item);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user || queue.length === 0) return null;

  const current = queue[0];
  const visible = queue.slice(0, 3);
  const stackCount = queue.length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
    queryClient.invalidateQueries({ queryKey: ["rentals"] });
    queryClient.invalidateQueries({ queryKey: ["adminRentals"] });
  };

  const handleAccept = async () => {
    try {
      await respondToRental(current.id, "accept");
      toast.success("Rezervare confirmată");
      invalidate();
      removeItem(current.id);
      const publicId = current.public_id;
      const url = publicId ? `/rezervari/${publicId}` : `/inchirierile-mele`;
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        navigate(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      if (e?.kyc) return;
      const raw = String(e?.message || "");
      if (raw.includes("not pending") || raw.includes("non-2xx") || raw.includes("not found")) {
        toast.error("Cererea nu mai este disponibilă (a fost anulată sau procesată).");
        removeItem(current.id);
        invalidate();
      } else {
        toast.error(raw || "Eroare la confirmare");
      }
    }
  };

  const handleReject = async () => {
    try {
      await respondToRental(current.id, "reject");
      toast.success("Cerere refuzată");
      invalidate();
      removeItem(current.id);
    } catch (e: any) {
      const raw = String(e?.message || "");
      if (raw.includes("not pending") || raw.includes("non-2xx") || raw.includes("not found")) {
        toast.error("Cererea nu mai este disponibilă (a fost anulată sau procesată).");
        removeItem(current.id);
        invalidate();
      } else {
        toast.error(raw || "Eroare la refuz");
      }
    }
  };

  const handleViewProduct = async () => {
    try { await markRenterConfirmationSeen(current.id); } catch {}
    const publicId = current.public_id;
    removeItem(current.id);
    if (publicId) navigate(`/rezervari/${publicId}`);
    else navigate(`/inchirierile-mele`);
  };

  const handleViewSimilar = async () => {
    try { await markRenterConfirmationSeen(current.id); } catch {}
    const cat = resolveCategorySlug(current.category_slug);
    const title = current.product_title || "";
    removeItem(current.id);
    if (cat) navigate(`/categorie/${cat}`);
    else navigate(`/cauta?q=${encodeURIComponent(title)}`);
  };

  const handleDismiss = async () => {
    if (current.mode === "renter") {
      await markRenterConfirmationSeen(current.id);
    }
    removeItem(current.id);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-4 pb-24 sm:items-center sm:pb-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[min(420px,calc(100vw-2rem))]"
        style={{ minHeight: 1 }}
      >
        {/* Ghost previews behind the main card */}
        {visible.slice(1).map((it, idx) => {
          const i = idx + 1; // 1 or 2
          const translate = i * 8;
          const scale = 1 - i * 0.05;
          const opacity = i === 1 ? 0.55 : 0.3;
          return (
            <div
              key={`ghost-${it.id}`}
              aria-hidden
              className="absolute inset-x-0 top-0 rounded-2xl border bg-card shadow-xl ring-1 ring-black/5 pointer-events-none transition-all duration-300 ease-out"
              style={{
                transform: `translateY(${translate}px) scale(${scale})`,
                opacity,
                zIndex: 10 - i,
                height: "100%",
              }}
            />
          );
        })}

        <div className="relative" style={{ zIndex: 10 }}>
          <RentalRequestPopup
            key={current.id}
            item={current}
            mode={current.mode}
            stackCount={stackCount}
            onAccept={handleAccept}
            onReject={handleReject}
            onViewProduct={handleViewProduct}
            onViewSimilar={handleViewSimilar}
            onDismiss={handleDismiss}
          />
        </div>
      </div>
    </div>
  );
}