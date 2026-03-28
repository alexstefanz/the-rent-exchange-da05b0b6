import { supabase } from "@/integrations/supabase/client";

export interface AdminProduct {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  daily_price_owner: number;
  location_city: string | null;
  images: string[] | null;
  is_active: boolean;
  admin_flagged: boolean;
  flag_reason: string | null;
  owner_id: string;
  owner_name: string;
  slug: string | null;
  created_at: string;
  approval_status: string;
}

export const approveProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'approved', is_active: true } as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const rejectProduct = async (productId: string, reason: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'rejected', is_active: false, flag_reason: reason } as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const fetchAdminProducts = async (
  searchQuery?: string,
  statusFilter?: string,
  categoryFilter?: string,
  limit = 50,
  offset = 0
): Promise<AdminProduct[]> => {
  const { data, error } = await supabase.rpc('get_admin_products', {
    search_query: searchQuery || null,
    status_filter: statusFilter || null,
    category_filter: categoryFilter || null,
    limit_count: limit,
    offset_count: offset
  });

  if (error) throw new Error(error.message);
  return (data || []) as AdminProduct[];
};

export const toggleProductActive = async (productId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive } as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const flagProduct = async (productId: string, flagReason: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ admin_flagged: true, flag_reason: flagReason } as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const unflagProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ admin_flagged: false, flag_reason: null } as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const fetchProductFullDetails = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('description, included_items, location_country, pickup_address')
    .eq('id', productId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateProductAdmin = async (
  productId: string,
  updates: { title?: string; description?: string; daily_price_owner?: number; category?: string; is_active?: boolean }
): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update(updates as Record<string, unknown>)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};
  if (error) throw new Error(error.message);
};
