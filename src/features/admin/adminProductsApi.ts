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
  admin_edited_at: string | null;
  admin_edited_by: string | null;
  created_via?: string | null;
}

const isPendingEdit = async (productId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('products')
    .select('approval_status, pending_edits' as any)
    .eq('id', productId)
    .maybeSingle();
  const d = data as any;
  return !!d?.pending_edits && d?.approval_status === 'approved';
};

export const approveProduct = async (productId: string): Promise<void> => {
  if (await isPendingEdit(productId)) {
    const { error } = await (supabase.rpc as any)('admin_apply_product_edits', { _id: productId });
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'approved', is_active: true } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);

  // Email sent in background — admin UI does not wait for it.
  void (async () => { try {
    const { data: prod } = await supabase
      .from('products')
      .select('title, slug, owner_id, images')
      .eq('id', productId)
      .single();
    if (prod?.owner_id) {
      // Transactional email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', prod.owner_id)
        .single();
      if (profile?.email) {
        await supabase.functions.invoke('send-admin-user-email', {
          body: {
            templateName: 'product-published',
            userId: prod.owner_id,
            idempotencyKey: `product-published-${productId}`,
            templateData: {
              name: profile.full_name || undefined,
              productTitle: prod.title,
              productImage: Array.isArray((prod as any).images) ? (prod as any).images[0] ?? null : null,
              productId: prod.slug || productId,
            },
          },
        });
      }
    }
  } catch (e) {
    console.error('[adminProductsApi] Failed to send product-published notifications:', e);
  } })();
};

export const rejectProduct = async (productId: string, reason: string): Promise<void> => {
  // Edit of a live listing: discard the proposed changes, keep the listing live with old data.
  if (await isPendingEdit(productId)) {
    const { error } = await (supabase.rpc as any)('admin_reject_product_edits', { _id: productId, _reason: reason });
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from('products')
    .update({ approval_status: 'rejected', is_active: false, flag_reason: reason } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);

  // Send notification email to owner (background, non-blocking)
  void (async () => { try {
    const { data: prod } = await supabase
      .from('products')
      .select('title, owner_id')
      .eq('id', productId)
      .single();
    if (prod?.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', prod.owner_id)
        .single();
      if (profile?.email) {
        await supabase.functions.invoke('send-admin-user-email', {
          body: {
            templateName: 'product-rejected',
            userId: prod.owner_id,
            idempotencyKey: `product-rejected-${productId}-${Date.now()}`,
            templateData: {
              name: profile.full_name || undefined,
              productTitle: prod.title,
              productId,
              reason,
            },
          },
        });
      }
    }
  } catch (e) {
    console.error('[adminProductsApi] Failed to send product-rejected email:', e);
  } })();
};

export const fetchAdminProducts = async (
  searchQuery?: string,
  statusFilter?: string,
  categoryFilter?: string,
  limit = 50,
  offset = 0,
  createdViaFilter?: string
): Promise<AdminProduct[]> => {
  const { data, error } = await supabase.rpc('get_admin_products', {
    search_query: searchQuery || null,
    status_filter: statusFilter || null,
    category_filter: categoryFilter || null,
    limit_count: limit,
    offset_count: offset,
    created_via_filter: createdViaFilter || null
  });

  if (error) throw new Error(error.message);
  return (data || []) as AdminProduct[];
};

export const toggleProductActive = async (productId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const flagProduct = async (productId: string, flagReason: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ admin_flagged: true, flag_reason: flagReason } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const unflagProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ admin_flagged: false, flag_reason: null } as never)
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

// ============ TRASH (soft-delete) ============

export interface DeletedProduct {
  id: string;
  title: string;
  category: string | null;
  daily_price_owner: number;
  images: string[] | null;
  owner_id: string;
  owner_name: string;
  slug: string | null;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string | null;
}

export const fetchDeletedProducts = async (): Promise<DeletedProduct[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, category, daily_price_owner, images, owner_id, slug, deleted_at, deleted_by')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data || []) as Array<Record<string, any>>;
  const userIds = Array.from(new Set(rows.flatMap(r => [r.owner_id, r.deleted_by]).filter(Boolean)));
  let nameById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (profiles || []).forEach((p: any) => nameById.set(p.id, p.full_name || 'Utilizator'));
  }

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    daily_price_owner: r.daily_price_owner,
    images: r.images,
    owner_id: r.owner_id,
    owner_name: nameById.get(r.owner_id) || 'Utilizator',
    slug: r.slug,
    deleted_at: r.deleted_at,
    deleted_by: r.deleted_by,
    deleted_by_name: r.deleted_by ? (nameById.get(r.deleted_by) || 'Utilizator') : null,
  }));
};

export const restoreProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: null, deleted_by: null } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};

export const fetchProductFullDetails = async (productId: string) => {
  // pickup_address is column-level restricted — route through the admin RPC.
  const { data, error } = await (supabase.rpc as any)(
    'get_admin_product_full_details',
    { _id: productId },
  );
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? {
    description: null,
    included_items: null,
    location_country: null,
    pickup_address: null,
  }) as {
    description: string | null;
    included_items: string[] | null;
    location_country: string | null;
    pickup_address: string | null;
  };
};

export const updateProductAdmin = async (
  productId: string,
  updates: { title?: string; description?: string; daily_price_owner?: number; category?: string; subcategory?: string; is_active?: boolean }
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('products')
    .update({
      ...updates,
      admin_edited_at: new Date().toISOString(),
      admin_edited_by: user?.id ?? null,
    } as never)
    .eq('id', productId);
  if (error) throw new Error(error.message);
};
