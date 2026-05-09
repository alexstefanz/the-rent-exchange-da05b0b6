import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecentRental {
  product_title: string;
  product_title_en: string | null;
  product_image: string | null;
  city: string | null;
  product_slug: string | null;
  time_ago_seconds: number;
}

export interface HomepageTotals {
  verified_users: number;
  avg_rating: number;
  total_reviews: number;
  total_active_products: number;
}

export interface HomepageActivity {
  recent_rentals: RecentRental[];
  totals: HomepageTotals;
}

export function useHomepageActivity() {
  const qc = useQueryClient();

  const query = useQuery<HomepageActivity>({
    queryKey: ["homepage-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_homepage_activity");
      if (error) throw error;
      return (data ?? { recent_rentals: [], totals: { verified_users: 0, avg_rating: 0, total_reviews: 0, total_active_products: 0 } }) as unknown as HomepageActivity;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("homepage-activity-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals" }, () => {
        qc.invalidateQueries({ queryKey: ["homepage-activity"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}