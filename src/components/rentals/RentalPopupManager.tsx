import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRentalPopups,
  fetchRentalPopupById,
  markRenterConfirmationSeen,
  type RentalPopupItem,
} from "@/features/rentals/popupApi";
import { respondToRental } from "@/features/rentals/ownerRentalsApi";
import RentalRequestPopup from "./RentalRequestPopup";
import { useQueryClient } from "@tanstack/react-query";

export default function RentalPopupManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<RentalPopupItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const pushItem = (item: RentalPopupItem) => {
    setQueue((q) => {
      if (q.some((x) => x.id === item.id)) return q;
      return [...q, item];
    });
  };

  const removeItem = (id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  };

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
    } catch (e: any) {
      toast.error(e?.message || "Eroare la confirmare");
    }
  };

  const handleReject = async () => {
    try {
      await respondToRental(current.id, "reject");
      toast.success("Cerere refuzată");
      invalidate();
      removeItem(current.id);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la refuz");
    }
  };

  const handleViewProduct = async () => {
    try { await markRenterConfirmationSeen(current.id); } catch {}
    const slug = current.product_slug;
    removeItem(current.id);
    if (slug) navigate(`/produs/${slug}`);
  };

  const handleViewSimilar = async () => {
    try { await markRenterConfirmationSeen(current.id); } catch {}
    const cat = current.category_slug;
    const title = current.product_title || "";
    removeItem(current.id);
    if (cat) navigate(`/categorie/${cat}`);
    else navigate(`/cautare?q=${encodeURIComponent(title)}`);
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
      <div onClick={(e) => e.stopPropagation()}>
        <RentalRequestPopup
          key={current.id}
          item={current}
          mode={current.mode}
          onAccept={handleAccept}
          onReject={handleReject}
          onViewProduct={handleViewProduct}
          onViewSimilar={handleViewSimilar}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}