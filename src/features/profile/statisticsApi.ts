import { supabase } from "@/integrations/supabase/client";

export interface UserStatistics {
  products_count: number;
  member_since: string | null;
  average_rating: number;
  reviews_count: number;
}

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
      reviews_count: Number(data[0].reviews_count) || 0,
    };
  }

  return null;
};
