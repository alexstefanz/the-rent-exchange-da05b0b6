import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";

export const addFavoriteUser = async (favoriteUserId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite_users")
    .insert({
      user_id: user.id,
      favorite_user_id: favoriteUserId,
    });

  if (error) {
    if (error.code === '23505') {
      // Already favorited, ignore
      return;
    }
    handleApiError("Error adding favorite", error);
  }
};

export const removeFavoriteUser = async (favoriteUserId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite_users")
    .delete()
    .eq("user_id", user.id)
    .eq("favorite_user_id", favoriteUserId);

  if (error) {
    handleApiError("Error removing favorite", error);
  }
};

export const isUserFavorite = async (targetUserId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_user_favorite', { target_user_id: targetUserId });

  if (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }

  return data ?? false;
};

export const getFavoriteUsers = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorite_users")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }

  return data?.map(f => f.favorite_user_id) || [];
};
