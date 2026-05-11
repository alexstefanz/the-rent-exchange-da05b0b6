import { supabase } from "@/integrations/supabase/client";

export interface SimilarPricing {
  p25: number | null;
  p50: number | null;
  p75: number | null;
  sample_size: number;
}

export const getSimilarPricing = async (
  category: string,
  subcategory?: string | null,
): Promise<SimilarPricing | null> => {
  if (!category) return null;
  const { data, error } = await (supabase.rpc as any)("get_similar_pricing", {
    p_category: category,
    p_subcategory: subcategory || null,
  });
  if (error) {
    console.error("getSimilarPricing", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    p25: row.p25 != null ? Number(row.p25) : null,
    p50: row.p50 != null ? Number(row.p50) : null,
    p75: row.p75 != null ? Number(row.p75) : null,
    sample_size: row.sample_size ?? 0,
  };
};