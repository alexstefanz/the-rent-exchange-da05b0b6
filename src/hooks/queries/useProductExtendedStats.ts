import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductExtendedStats {
  times_rented: number;
  last_booking_at: string | null;
  watchers_count: number;
  owner_total_rentals: number;
  owner_response_minutes: number | null;
  owner_response_rate: number | null;
  owner_member_since: string | null;
  owner_avg_rating: number | null;
  owner_review_count: number;
}

export function useProductExtendedStats(productId?: string) {
  return useQuery({
    queryKey: ["product-extended-stats", productId],
    enabled: !!productId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_product_extended_stats", { p_product_id: productId! });
      if (error) throw error;
      return data as unknown as ProductExtendedStats;
    },
  });
}

export interface ReviewBreakdown {
  avg_rating: number;
  count: number;
  avg_communication: number | null;
  avg_condition: number | null;
  avg_punctuality: number | null;
}

export function useProductReviewBreakdown(productId?: string) {
  return useQuery({
    queryKey: ["product-review-breakdown", productId],
    enabled: !!productId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_product_review_breakdown", { p_product_id: productId! });
      if (error) throw error;
      return data as unknown as ReviewBreakdown;
    },
  });
}
