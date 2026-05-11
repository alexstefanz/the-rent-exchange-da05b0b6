import { supabase } from "@/integrations/supabase/client";
import type { PublishFormData } from "@/lib/publishTypes";

export interface ProductDraft {
  id: string;
  owner_id: string;
  product_id: string | null;
  payload: PublishFormData;
  step: number;
  updated_at: string;
}

export const getActiveDraft = async (
  ownerId: string,
  productId: string | null,
): Promise<ProductDraft | null> => {
  let query = (supabase.from("product_drafts" as any).select("*") as any)
    .eq("owner_id", ownerId);

  if (productId) query = query.eq("product_id", productId);
  else query = query.is("product_id", null);

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error("getActiveDraft", error);
    return null;
  }
  return data as ProductDraft | null;
};

export const upsertDraft = async (
  ownerId: string,
  productId: string | null,
  payload: PublishFormData,
  step: number,
  existingId?: string,
): Promise<string | null> => {
  if (existingId) {
    const { error } = await (supabase.from("product_drafts" as any) as any)
      .update({ payload, step })
      .eq("id", existingId);
    if (error) {
      console.error("upsertDraft update", error);
      return null;
    }
    return existingId;
  }

  const { data, error } = await (supabase.from("product_drafts" as any) as any)
    .insert({ owner_id: ownerId, product_id: productId, payload, step })
    .select("id")
    .single();

  if (error) {
    console.error("upsertDraft insert", error);
    return null;
  }
  return (data as any).id;
};

export const deleteDraft = async (id: string): Promise<void> => {
  await (supabase.from("product_drafts" as any) as any).delete().eq("id", id);
};