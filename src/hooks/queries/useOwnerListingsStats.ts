import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OwnerListingsStats {
  total: number;
  active: number;
  pending: number;
  hidden: number;
  rejected: number;
  drafts: number;
  new_requests: number;
  earnings_total: number;
}

const empty: OwnerListingsStats = {
  total: 0, active: 0, pending: 0, hidden: 0, rejected: 0, drafts: 0, new_requests: 0, earnings_total: 0,
};

export function useOwnerListingsStats(ownerId?: string) {
  return useQuery({
    queryKey: ["owner-listings-stats", ownerId],
    enabled: !!ownerId,
    staleTime: 30_000,
    queryFn: async (): Promise<OwnerListingsStats> => {
      const { data, error } = await (supabase.rpc as any)("get_owner_listings_stats", { p_owner: ownerId });
      if (error) {
        console.error("get_owner_listings_stats", error);
        return empty;
      }
      return { ...empty, ...(data as any) };
    },
  });
}