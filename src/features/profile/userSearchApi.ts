import { supabase } from "@/integrations/supabase/client";

export interface SearchedUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  products_count: number;
}

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  if (!query || query.length < 2) return [];

  // Use optimized database function that performs a single query
  const { data, error } = await supabase
    .rpc('search_users_by_name', { 
      search_query: query, 
      result_limit: 20 
    });

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return (data || []).map(user => ({
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    products_count: Number(user.products_count),
  }));
};
