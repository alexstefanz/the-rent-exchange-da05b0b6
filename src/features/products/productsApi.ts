import { supabase } from "@/integrations/supabase/client";
import { sanitizeSearchInput } from "@/lib/inputValidation";
import { handleApiError } from "@/lib/errorHandler";
import { expandSearchTerms } from "@/lib/searchSynonyms";

export interface Product {
  id: string;
  owner_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  title_en?: string | null;
  description_en?: string | null;
  daily_price_owner: number;
  platform_fee_percent: number;
  category: string | null;
  subcategory: string | null;
  location_city: string | null;
  location_country: string | null;
  pickup_address: string | null;
  images: string[];
  included_items: string[] | null;
  is_active: boolean;
  approval_status?: string;
  created_at: string;
  // Premium publish fields
  condition?: string | null;
  deposit_type?: string | null;
  deposit_value?: number | null;
  min_rental_days?: number | null;
  min_rental_preset?: string | null;
  max_rental_days?: number | null;
  delivery_available?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius_km?: number | null;
  pickup_available?: boolean | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  usage_rules?: string[] | null;
  available_immediately?: boolean | null;
  blocked_dates?: string[] | null;
  quality_score?: number | null;
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
  // Use the diacritic-insensitive RPC so that "roaba" matches "Roabă", etc.
  const sanitizedSearch = filters?.search
    ? sanitizeSearchInput(filters.search, 100)
    : null;

  // Expand abbreviations / synonyms so that "TV" also matches "Televizor".
  const expandedTerms = sanitizedSearch ? expandSearchTerms(sanitizedSearch) : null;
  const useTerms = expandedTerms && expandedTerms.length > 1;

  const { data, error } = await (supabase.rpc as any)("search_products", {
    _search: useTerms ? null : sanitizedSearch || null,
    _search_terms: useTerms ? expandedTerms : null,
    _category: filters?.category || null,
    _subcategory: filters?.subcategory || null,
    _location_city: filters?.location_city || null,
  });

  if (error) {
    handleApiError("Error fetching products", error);
  }

  return (data as Product[]) || [];
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching product", error);
  }

  return data;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching product by slug", error);
  }

  return data;
};

export const getMyProducts = async (ownerId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    handleApiError("Error fetching my products", error);
  }

  return data || [];
};

// Get public products for a specific user (for public profile page)
export const getPublicUserProducts = async (ownerId: string): Promise<Product[]> => {
  const { data, error } = await (supabase
    .from("products")
    .select("*") as any)
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    handleApiError("Error fetching user products", error);
  }

  return data || [];
};

export const getOwnerProductCount = async (ownerId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (error) {
    console.error("Error counting products", error);
    return 0;
  }

  return count || 0;
};

export interface PublishProductInput {
  title: string;
  description?: string;
  daily_price_owner: number;
  category?: string;
  subcategory?: string;
  location_city?: string;
  location_country?: string;
  pickup_address?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  pickup_available?: boolean;
  delivery_available?: boolean;
  delivery_fee?: number | null;
  delivery_radius_km?: number | null;
  images?: string[];
  included_items?: string[];
  usage_rules?: string[];
  condition?: string | null;
  deposit_type?: string;
  deposit_value?: number | null;
  min_rental_days?: number;
  min_rental_preset?: string | null;
  max_rental_days?: number | null;
  available_immediately?: boolean;
  blocked_dates?: string[];
  quality_score?: number;
  serial_number?: string | null;
}

export const createProduct = async (
  data: PublishProductInput,
  ownerId: string,
): Promise<Product> => {
  // Count existing products to determine fee
  const existingCount = await getOwnerProductCount(ownerId);
  const platformFeePercent = existingCount < 3 ? 0 : 5;

  const insertData: Record<string, unknown> = {
    owner_id: ownerId,
    title: data.title,
    description: data.description || null,
    daily_price_owner: data.daily_price_owner,
    platform_fee_percent: platformFeePercent,
    category: data.category || null,
    subcategory: data.subcategory || null,
    location_city: data.location_city || null,
    location_country: data.location_country || "Romania",
    pickup_address: data.pickup_address || null,
    pickup_lat: data.pickup_lat ?? null,
    pickup_lng: data.pickup_lng ?? null,
    pickup_available: data.pickup_available ?? true,
    delivery_available: data.delivery_available ?? false,
    delivery_fee: data.delivery_fee ?? null,
    delivery_radius_km: data.delivery_radius_km ?? null,
    images: data.images || [],
    included_items: data.included_items || [],
    usage_rules: data.usage_rules || [],
    condition: data.condition ?? null,
    deposit_type: data.deposit_type ?? "none",
    deposit_value: data.deposit_value ?? null,
    min_rental_days: data.min_rental_days ?? 1,
    min_rental_preset: data.min_rental_preset ?? null,
    max_rental_days: data.max_rental_days ?? null,
    available_immediately: data.available_immediately ?? true,
    blocked_dates: data.blocked_dates || [],
    quality_score: data.quality_score ?? 0,
    serial_number: data.serial_number ?? null,
    is_active: false,
    approval_status: 'pending',
  };

  const { data: product, error } = await supabase
    .from("products")
    .insert(insertData as any)
    .select()
    .single();

  if (error) {
    if (typeof error.message === "string" && error.message.includes("KYC_REQUIRED")) {
      const e = new Error("KYC_REQUIRED");
      (e as any).code = "KYC_REQUIRED";
      throw e;
    }
    handleApiError("Error creating product", error);
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: Partial<PublishProductInput> & { is_active?: boolean },
  ownerId: string,
): Promise<Product> => {
  const { data: product, error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) {
    handleApiError("Error updating product", error);
  }

  return product;
};

export const deleteProduct = async (id: string, ownerId: string): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), deleted_by: ownerId } as never)
    .eq("id", id)
    .eq("owner_id", ownerId);

  if (error) {
    handleApiError("Error deleting product", error);
  }
};

export const getNearbyProducts = async (
  currentProductId: string,
  locationCity: string | null,
  category: string | null,
  limit: number = 8
): Promise<Product[]> => {
  let query = (supabase
    .from("products")
    .select("*") as any)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .neq("id", currentProductId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // First try to find products from the same city
  if (locationCity) {
    query = query.eq("location_city", locationCity);
  }

  const { data, error } = await query;

  if (error) {
    handleApiError("Error fetching nearby products", error);
  }

  // If we don't have enough products from the same city, get more from same category
  if ((data?.length || 0) < limit && category) {
    const existingIds = data?.map(p => p.id) || [];
    const { data: categoryData, error: categoryError } = await (supabase
      .from("products")
      .select("*") as any)
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .eq("category", category)
      .not("id", "in", `(${[currentProductId, ...existingIds].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - (data?.length || 0));

    if (!categoryError && categoryData) {
      return [...(data || []), ...categoryData];
    }
  }

  return data || [];
};
