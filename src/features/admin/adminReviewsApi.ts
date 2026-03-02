import { supabase } from "@/integrations/supabase/client";

export interface AdminProductReview {
  id: string;
  reviewer_id: string;
  product_id: string;
  rating: number;
  rating_product_condition: number | null;
  rating_communication: number | null;
  rating_punctuality: number | null;
  review_type: string;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
}

export async function fetchProductReviews(productId: string): Promise<AdminProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, profiles:reviewer_id(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    reviewer_id: r.reviewer_id,
    product_id: r.product_id,
    rating: r.rating,
    rating_product_condition: r.rating_product_condition,
    rating_communication: r.rating_communication,
    rating_punctuality: r.rating_punctuality,
    review_type: r.review_type,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: r.profiles?.full_name || null,
    reviewer_avatar: r.profiles?.avatar_url || null,
  }));
}

export async function deleteProductReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);
  if (error) throw error;
}
