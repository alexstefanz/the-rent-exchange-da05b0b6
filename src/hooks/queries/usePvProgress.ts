import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PvProgress {
  ownerCheckout: boolean;
  renterCheckout: boolean;
  ownerCheckin: boolean;
  renterCheckin: boolean;
}

const EMPTY: PvProgress = {
  ownerCheckout: false,
  renterCheckout: false,
  ownerCheckin: false,
  renterCheckin: false,
};

/**
 * Returns whether each party has submitted a valid (>=3 photos) PV row
 * for both phases. Updated automatically via realtime invalidation.
 */
export function usePvProgress(rentalId: string | undefined) {
  return useQuery({
    queryKey: ["pv-progress", rentalId],
    enabled: !!rentalId,
    queryFn: async (): Promise<PvProgress> => {
      if (!rentalId) return EMPTY;
      const { data, error } = await supabase
        .from("rental_inspections")
        .select("phase, role, photos")
        .eq("rental_id", rentalId);
      if (error || !data) return EMPTY;
      const has = (phase: string, role: string) =>
        data.some(
          (r: any) =>
            r.phase === phase &&
            r.role === role &&
            Array.isArray(r.photos) &&
            r.photos.length >= 3,
        );
      return {
        ownerCheckout: has("checkout", "owner"),
        renterCheckout: has("checkout", "renter"),
        ownerCheckin: has("checkin", "owner"),
        renterCheckin: has("checkin", "renter"),
      };
    },
  });
}