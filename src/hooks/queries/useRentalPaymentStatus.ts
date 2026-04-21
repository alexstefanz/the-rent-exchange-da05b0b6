import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchRentalPaymentStatus } from "@/features/rentals/paymentStatusApi";

export const useRentalPaymentStatus = (rentalId: string | undefined, enabled = true) => {
  const qc = useQueryClient();
  const queryKey = ["rental-payment-status", rentalId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRentalPaymentStatus(rentalId!),
    enabled: !!rentalId && enabled,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!rentalId || !enabled) return;
    const channel = supabase
      .channel(`rental-payment-${rentalId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals", filter: `id=eq.${rentalId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `rental_id=eq.${rentalId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rentalId, enabled, qc]);

  return query;
};