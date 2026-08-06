import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MapPoint {
  id: string;
  approx_lat: number;
  approx_lng: number;
  has_precise: boolean;
}

/**
 * Approximate (privacy-protected) map coordinates for a set of listings.
 * Exact pickup coordinates are never exposed — the RPC rounds and offsets them.
 */
export const useProductsMapPoints = (ids: string[]) => {
  const key = [...ids].sort().join(",");
  return useQuery<Record<string, MapPoint>>({
    queryKey: ["products-map-points", key],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_products_map_points", { _ids: ids });
      if (error) throw error;
      const map: Record<string, MapPoint> = {};
      for (const row of (data as MapPoint[]) || []) {
        map[row.id] = {
          id: row.id,
          approx_lat: Number(row.approx_lat),
          approx_lng: Number(row.approx_lng),
          has_precise: row.has_precise,
        };
      }
      return map;
    },
  });
};
