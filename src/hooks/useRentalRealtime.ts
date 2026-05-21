import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime updates on rentals & inspections for a given user.
 * Invalidates the relevant React Query keys whenever the DB changes.
 */
export function useRentalRealtime(
  userId: string | undefined,
  role: "renter" | "owner",
  invalidateKeys: string[][],
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const filterCol = role === "renter" ? "renter_id" : "owner_id";
    const channel = supabase
      .channel(`rental-rt-${role}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals", filter: `${filterCol}=eq.${userId}` },
        () => invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rental_inspections" },
        () => invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_pv_documents" },
        () => invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, qc, invalidateKeys]);
}