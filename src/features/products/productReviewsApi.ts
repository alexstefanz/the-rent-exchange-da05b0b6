import { supabase } from "@/integrations/supabase/client";
import { containsProfanityWords } from "@/lib/profanityFilter";
import { containsContactInfo } from "@/lib/inputValidation";

export const CONTACT_REVIEW_ERROR = "Recenzia nu poate conține numere de telefon, adrese de email sau link-uri.";

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
    .eq("status", "approved")
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
  comment: string,
  rentalId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const overall = Math.round((ratings.condition + ratings.communication + ratings.punctuality) / 3);

  if (comment && containsProfanityWords(comment).hit) {
    throw new Error("Comentariul conține limbaj inadecvat. Te rugăm să-l reformulezi.");
  }

  if (comment && containsContactInfo(comment)) {
    throw new Error(CONTACT_REVIEW_ERROR);
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    reviewer_id: user.id,
    rating: overall,
    rating_product_condition: ratings.condition,
    rating_communication: ratings.communication,
    rating_punctuality: ratings.punctuality,
    review_type: reviewType,
    comment: comment || null,
    rental_id: rentalId || null,
  });

  if (error) throw error;

  // Low ratings are held for moderation — notify only once published.
  if (overall <= 3) return;

  // Send review notification (fire and forget)
  try {
    // Get product info to find owner
    const { data: product } = await supabase
      .from("products")
      .select("owner_id, title")
      .eq("id", productId)
      .single();

    const { data: reviewer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (product?.owner_id && product.owner_id !== user.id) {
      await supabase.functions.invoke("send-general-notification", {
        body: {
          type: "review_received",
          reviewer_name: reviewer?.full_name || "Un utilizator",
          rating: overall,
          comment: comment || null,
          recipient_user_id: product.owner_id,
          product_title: product.title,
        },
      });
    }
  } catch (e) {
    console.error("Failed to send review notification:", e);
  }
}
