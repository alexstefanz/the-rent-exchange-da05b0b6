import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";
import { containsProfanityWords } from "@/lib/profanityFilter";
import { containsContactInfo } from "@/lib/inputValidation";

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const getUserReviews = async (userId: string): Promise<UserReview[]> => {
  // Use optimized database function that fetches reviews with reviewer info in one query
  const { data, error } = await supabase
    .rpc('get_user_reviews_with_reviewers', { target_user_id: userId });

  if (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }

  return (data || []).map(review => ({
    id: review.id,
    reviewer_id: review.reviewer_id,
    reviewed_user_id: review.reviewed_user_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    reviewer: {
      full_name: review.reviewer_full_name,
      avatar_url: review.reviewer_avatar_url,
    },
  }));
};

export const createUserReview = async (
  reviewedUserId: string,
  rating: number,
  comment?: string,
  productTitle?: string,
  rentalId?: string
): Promise<UserReview> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (comment && containsProfanityWords(comment).hit) {
    throw new Error("Comentariul conține limbaj inadecvat. Te rugăm să-l reformulezi.");
  }

  if (comment && containsContactInfo(comment)) {
    throw new Error("Recenzia nu poate conține numere de telefon, adrese de email sau link-uri.");
  }

  const { data, error } = await supabase
    .from("user_reviews")
    .insert({
      reviewer_id: user.id,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment || null,
      rental_id: rentalId || null,
    })
    .select()
    .single();

  if (error) {
    handleApiError("Error creating review", error);
  }

  // Low ratings are held for moderation — notify only once published.
  if (rating <= 3) return data;

  // Send review notification (fire and forget)
  try {
    const { data: reviewer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await supabase.functions.invoke("send-general-notification", {
      body: {
        type: "review_received",
        reviewer_name: reviewer?.full_name || "Un utilizator",
        rating,
        comment: comment || null,
        recipient_user_id: reviewedUserId,
        product_title: productTitle || null,
      },
    });
  } catch (e) {
    console.error("Failed to send review notification:", e);
  }

  return data;
};

export interface GivenReview {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewed_user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const getUserGivenReviews = async (userId: string): Promise<GivenReview[]> => {
  const { data, error } = await supabase
    .rpc('get_user_given_reviews_with_targets', { target_user_id: userId });

  if (error) {
    console.error("Error fetching given reviews:", error);
    return [];
  }

  return (data || []).map((review: any) => ({
    id: review.id,
    reviewer_id: review.reviewer_id,
    reviewed_user_id: review.reviewed_user_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    reviewed_user: {
      full_name: review.reviewed_full_name,
      avatar_url: review.reviewed_avatar_url,
    },
  }));
};

export const deleteUserReview = async (reviewId: string): Promise<void> => {
  const { error } = await supabase
    .from("user_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    handleApiError("Error deleting review", error);
  }
};
