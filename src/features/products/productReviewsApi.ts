import { supabase } from "@/integrations/supabase/client";

export interface ProductReview {
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

export async function getProductReviews(productId: string): Promise<{ owner: ProductReview[]; renter: ProductReview[] }> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, profiles:reviewer_id(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const mapped = (data || []).map((r: any) => ({
    id: r.id,
    reviewer_id: r.reviewer_id,
    product_id: r.product_id,
    rating: r.rating,
    rating_product_condition: r.rating_product_condition,
    rating_communication: r.rating_communication,
    rating_punctuality: r.rating_punctuality,
    review_type: r.review_type || "owner",
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: r.profiles?.full_name || null,
    reviewer_avatar: r.profiles?.avatar_url || null,
  }));

  return {
    owner: mapped.filter((r) => r.review_type === "owner"),
    renter: mapped.filter((r) => r.review_type === "renter"),
  };
}

export async function createProductReview(
  productId: string,
  reviewType: "owner" | "renter",
  ratings: { condition: number; communication: number; punctuality: number },
  comment: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const overall = Math.round((ratings.condition + ratings.communication + ratings.punctuality) / 3);

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    reviewer_id: user.id,
    rating: overall,
    rating_product_condition: ratings.condition,
    rating_communication: ratings.communication,
    rating_punctuality: ratings.punctuality,
    review_type: reviewType,
    comment: comment || null,
  });

  if (error) throw error;
}
