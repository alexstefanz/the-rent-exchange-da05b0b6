import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategoryCounts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["category-counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .is("deleted_at", null);
      if (error) return {};
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return counts;
    },
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    const channel = supabase
      .channel("category-counts-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["category-counts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query.data;
};
