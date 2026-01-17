import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStatistics {
  products_count: number;
  member_since: string | null;
  average_rating: number;
  reviews_count: number;
}

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching profile", error);
  }

  return data;
};

export const createProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: data.full_name || null,
      phone: data.phone || null,
    })
    .select()
    .single();

  if (error) {
    handleApiError("Error creating profile", error);
  }

  return profile;
};

export const updateProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string; email?: string; whatsapp?: string; avatar_url?: string }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    handleApiError("Error updating profile", error);
  }

  return profile;
};

// Get public profile info for users with active products (for public profile page)
export const getPublicProfile = async (userId: string): Promise<{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
} | null> => {
  const { data, error } = await supabase
    .rpc('get_product_owner_public_info', { owner_uuid: userId });
  
  if (error) {
    console.error("Error fetching public profile:", error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
};

// Get user statistics
export const getUserStatistics = async (userId: string): Promise<UserStatistics | null> => {
  const { data, error } = await supabase
    .rpc('get_user_statistics', { target_user_id: userId });
  
  if (error) {
    console.error("Error fetching user statistics:", error);
    return null;
  }
  
  if (data && data.length > 0) {
    return {
      products_count: Number(data[0].products_count) || 0,
      member_since: data[0].member_since,
      average_rating: Number(data[0].average_rating) || 0,
      reviews_count: Number(data[0].reviews_count) || 0
    };
  }
  
  return null;
};

// Get user reviews
export const getUserReviews = async (userId: string): Promise<UserReview[]> => {
  const { data, error } = await supabase
    .from("user_reviews")
    .select("*")
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }

  return data || [];
};

// Create a review for a user
export const createUserReview = async (
  reviewerId: string,
  reviewedUserId: string,
  rating: number,
  comment?: string
): Promise<UserReview | null> => {
  const { data, error } = await supabase
    .from("user_reviews")
    .insert({
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment || null
    })
    .select()
    .single();

  if (error) {
    handleApiError("Error creating review", error);
    return null;
  }

  return data;
};

// Check if user is in favorites
export const isUserFavorite = async (targetUserId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_user_favorite', { target_user_id: targetUserId });
  
  if (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
  
  return data || false;
};

// Add user to favorites
export const addUserToFavorites = async (targetUserId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("favorite_users")
    .insert({
      user_id: user.id,
      favorite_user_id: targetUserId
    });

  if (error) {
    console.error("Error adding to favorites:", error);
    return false;
  }

  return true;
};

// Remove user from favorites
export const removeUserFromFavorites = async (targetUserId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("favorite_users")
    .delete()
    .eq("user_id", user.id)
    .eq("favorite_user_id", targetUserId);

  if (error) {
    console.error("Error removing from favorites:", error);
    return false;
  }

  return true;
};

// Get user's favorite users
export const getFavoriteUsers = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorite_users")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching favorite users:", error);
    return [];
  }

  return data?.map(f => f.favorite_user_id) || [];
};
