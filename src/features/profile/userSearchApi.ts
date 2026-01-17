import { supabase } from "@/integrations/supabase/client";

export interface SearchedUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  products_count: number;
}

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  if (!query || query.length < 2) return [];

  // Search profiles by name - we need to use a different approach since profiles table has RLS
  // We'll search through products and get unique owners
  const { data: products, error } = await supabase
    .from("products")
    .select("owner_id")
    .eq("is_active", true);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  // Get unique owner IDs
  const uniqueOwnerIds = [...new Set(products?.map(p => p.owner_id) || [])];
  
  // Fetch profile info for each owner
  const users: SearchedUser[] = [];
  
  for (const ownerId of uniqueOwnerIds) {
    const { data: profileData } = await supabase
      .rpc('get_product_owner_public_info', { owner_uuid: ownerId });
    
    if (profileData && profileData.length > 0) {
      const profile = profileData[0];
      // Check if name matches the search query
      if (profile.full_name && profile.full_name.toLowerCase().includes(query.toLowerCase())) {
        // Count products
        const productCount = products?.filter(p => p.owner_id === ownerId).length || 0;
        
        users.push({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          products_count: productCount,
        });
      }
    }
  }

  return users;
};
