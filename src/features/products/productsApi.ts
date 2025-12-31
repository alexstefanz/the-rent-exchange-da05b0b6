import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  daily_price_owner: number;
  platform_fee_percent: number;
  category: string | null;
  subcategory: string | null;
  location_city: string | null;
  location_country: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  location_city?: string;
  search?: string;
}

export const calculateClientPrice = (ownerPrice: number, feePercent: number): number => {
  return Math.round(ownerPrice * (1 + feePercent / 100) * 100) / 100;
};

export const getProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.subcategory) {
    query = query.eq("subcategory", filters.subcategory);
  }

  if (filters?.location_city) {
    query = query.eq("location_city", filters.location_city);
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data || [];
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product:", error);
    throw error;
  }

  return data;
};

export const getMyProducts = async (ownerId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my products:", error);
    throw error;
  }

  return data || [];
};

export const createProduct = async (
  data: {
    title: string;
    description?: string;
    daily_price_owner: number;
    category?: string;
    subcategory?: string;
    location_city?: string;
    location_country?: string;
    images?: string[];
  },
  ownerId: string
): Promise<Product> => {
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      owner_id: ownerId,
      title: data.title,
      description: data.description || null,
      daily_price_owner: data.daily_price_owner,
      platform_fee_percent: 20.0,
      category: data.category || null,
      subcategory: data.subcategory || null,
      location_city: data.location_city || null,
      location_country: data.location_country || "Romania",
      images: data.images || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    daily_price_owner?: number;
    category?: string;
    subcategory?: string;
    location_city?: string;
    location_country?: string;
    images?: string[];
    is_active?: boolean;
  },
  ownerId: string
): Promise<Product> => {
  const { data: product, error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }

  return product;
};
