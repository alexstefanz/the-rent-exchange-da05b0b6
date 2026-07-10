import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/features/products/productsApi";

export const useHomepagePopularProducts = (limit: number = 8) => {
  return useQuery({
    queryKey: ["homepage-popular-products", limit],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await (supabase.rpc as any)(
        "get_homepage_popular_products",
        { _limit: limit }
      );
      if (error) throw error;
      return (data as Product[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};