import { supabase } from "@/integrations/supabase/client";

export interface PlatformCategory {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSubcategory {
  id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const catsTable = () => supabase.from('platform_categories' as any);
const subsTable = () => supabase.from('platform_subcategories' as any);

export const fetchCategories = async (): Promise<PlatformCategory[]> => {
  const { data, error } = await catsTable()
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as PlatformCategory[];
};

export const fetchSubcategories = async (categoryId?: string): Promise<PlatformSubcategory[]> => {
  let query = subsTable()
    .select('*')
    .order('sort_order', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as unknown as PlatformSubcategory[];
};

export const createCategory = async (category: { name: string; name_en?: string; icon?: string; sort_order?: number }): Promise<void> => {
  const { error } = await catsTable().insert(category);
  if (error) throw new Error(error.message);
};

export const updateCategory = async (id: string, updates: Partial<PlatformCategory>): Promise<void> => {
  const { error } = await catsTable().update(updates).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await catsTable().delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleCategoryActive = async (id: string, isActive: boolean): Promise<void> => {
  const { error } = await catsTable().update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);
};

export const createSubcategory = async (sub: { category_id: string; name: string; name_en?: string; description?: string; description_en?: string; image_url?: string; sort_order?: number }): Promise<void> => {
  const { error } = await subsTable().insert(sub);
  if (error) throw new Error(error.message);
};

export const updateSubcategory = async (id: string, updates: Partial<PlatformSubcategory>): Promise<void> => {
  const { error } = await subsTable().update(updates).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteSubcategory = async (id: string): Promise<void> => {
  const { error } = await subsTable().delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleSubcategoryActive = async (id: string, isActive: boolean): Promise<void> => {
  const { error } = await subsTable().update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);
};
