import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";

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
  const { data, error } = await supabase
    .from("user_reviews")
    .select(`
      id,
      reviewer_id,
      reviewed_user_id,
      rating,
      comment,
      created_at
    `)
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }

  // Fetch reviewer profiles separately due to RLS
  const reviewerIds = [...new Set(data?.map(r => r.reviewer_id) || [])];
  const reviewerProfiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

  for (const reviewerId of reviewerIds) {
    const { data: profileData } = await supabase
      .rpc('get_product_owner_public_info', { owner_uuid: reviewerId });
    
    if (profileData && profileData.length > 0) {
      reviewerProfiles[reviewerId] = {
        full_name: profileData[0].full_name,
        avatar_url: profileData[0].avatar_url,
      };
    }
  }

  return (data || []).map(review => ({
    ...review,
    reviewer: reviewerProfiles[review.reviewer_id] || { full_name: null, avatar_url: null },
  }));
};

export const createUserReview = async (
  reviewedUserId: string,
  rating: number,
  comment?: string
): Promise<UserReview> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_reviews")
    .insert({
      reviewer_id: user.id,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) {
    handleApiError("Error creating review", error);
  }

  return data;
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
