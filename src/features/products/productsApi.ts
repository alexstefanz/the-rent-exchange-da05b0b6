import { calcPlatformFee } from "@/lib/rentalPricing";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeSearchInput } from "@/lib/inputValidation";
import { handleApiError } from "@/lib/errorHandler";
import { expandSearchTerms } from "@/lib/searchSynonyms";

// Sensitive columns (pickup_address, pickup_lat, pickup_lng, serial_number,
// admin_flagged, flag_reason, admin_edited_at, admin_edited_by) are revoked
// at column level. They are populated only via the owner/admin RPCs below.
export const PRODUCT_SAFE_COLS =
  "id,owner_id,title,slug,description,title_en,description_en," +
  "daily_price_owner,platform_fee_percent,category,subcategory," +
  "location_city,location_country,images,included_items,included_items_en," +
  "is_active,approval_status,created_at,condition,deposit_type,deposit_value," +
  "min_rental_days,min_rental_preset,max_rental_days,delivery_available," +
  "delivery_fee,delivery_radius_km,pickup_available,usage_rules," +
  "available_immediately,blocked_dates,quality_score,available_from," +
  "deletion_requested_at";

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
  // Populated only for the product owner (via merge) or admin RPC.
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
  // Populated only for the owner (via merge) or admin RPC.
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  usage_rules?: string[] | null;
  available_immediately?: boolean | null;
  blocked_dates?: string[] | null;
  quality_score?: number | null;
  available_from?: string | null;
  deletion_requested_at?: string | null;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  location_city?: string;
  search?: string;
}

/**
 * Per-day price displayed to clients in lists and product pages.
 *
 * NEW MODEL (2026-05): the listed daily price equals the owner's net price.
 * The platform fee is added on top only at checkout / on the rental record,
 * with a floor of 1 RON enforced server-side. `feePercent` is kept for
 * backwards compatibility with existing call sites.
 */
export const calculateClientPrice = (ownerPrice: number, feePercent: number): number => {
  const owner = Number(ownerPrice) || 0;
  // Per-day display price: owner + Rentli commission. Card processing fee
  // is a per-payment cost shown separately at checkout.
  return Math.round((owner + calcPlatformFee(owner, Number(feePercent) || 0)) * 100) / 100;
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
    .select(PRODUCT_SAFE_COLS as any)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching product", error);
  }

  return (data as unknown as Product | null) ?? null;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SAFE_COLS as any)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching product by slug", error);
  }

  return (data as unknown as Product | null) ?? null;
};

export type ProductLookupStatus = "exists" | "deleted" | "not_found";

export interface ProductLookupResult {
  status: ProductLookupStatus;
  product: Product | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a product by slug or UUID and distinguishes between "deleted" and
 * "not found" so the UI can show a dedicated "listing removed" page on stale
 * links instead of a generic 404.
 */
export const getProductLookup = async (slugOrId: string): Promise<ProductLookupResult> => {
  const isUuid = UUID_RE.test(slugOrId);

  // Try the normal (live) fetch first — fastest path for the common case.
  const product = isUuid ? await getProductById(slugOrId) : await getProductBySlug(slugOrId);
  if (product) return { status: "exists", product };

  // Fall back to a tiny SECURITY DEFINER RPC that bypasses RLS and only
  // exposes { exists, deleted } so we can tell "deleted" from "never existed".
  try {
    if (isUuid) {
      const { data } = await (supabase.rpc as any)("get_product_deletion_status_by_id", { _id: slugOrId });
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.exists_flag) return { status: row.deleted ? "deleted" : "not_found", product: null };
    } else {
      const { data } = await (supabase.rpc as any)("get_product_deletion_status", { _slug: slugOrId });
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.exists_flag) return { status: row.deleted ? "deleted" : "not_found", product: null };
    }
  } catch (e) {
    console.error("getProductLookup status RPC failed", e);
  }

  return { status: "not_found", product: null };
};

export const getMyProducts = async (ownerId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select((PRODUCT_SAFE_COLS + ",pending_edits,pending_edits_submitted_at") as any)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    handleApiError("Error fetching my products", error);
  }

  const rows = ((data as unknown) as Product[] | null) || [];
  if (rows.length === 0) return rows;

  // Merge owner-only sensitive fields via secure RPC.
  try {
    const { data: sens } = await (supabase.rpc as any)("get_my_products_sensitive");
    const byId = new Map<string, any>((sens || []).map((r: any) => [r.id, r]));
    return rows.map((p) => {
      const s = byId.get(p.id);
      if (!s) return p;
      return {
        ...p,
        pickup_address: s.pickup_address,
        pickup_lat: s.pickup_lat,
        pickup_lng: s.pickup_lng,
        serial_number: s.serial_number,
      } as Product;
    });
  } catch {
    return rows;
  }
};

// Get public products for a specific user (for public profile page)
export const getPublicUserProducts = async (ownerId: string): Promise<Product[]> => {
  const { data, error } = await (supabase
    .from("products")
    .select(PRODUCT_SAFE_COLS) as any)
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    handleApiError("Error fetching user products", error);
  }

  return ((data as unknown) as Product[] | null) || [];
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

/** Owner may change these on a live listing without admin review (no free text/images). */
export const INSTANT_EDIT_FIELDS = [
  "daily_price_owner",
  "min_rental_days",
  "min_rental_preset",
  "max_rental_days",
  "pickup_available",
  "delivery_available",
  "delivery_radius_km",
  "available_immediately",
  "available_from",
  "blocked_dates",
] as const;

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Split an edit into instantly-applied fields and changed fields needing moderation. */
export const partitionEdits = (
  edits: Record<string, unknown>,
  current: Record<string, unknown>,
) => {
  const instant: Record<string, unknown> = {};
  const moderated: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(edits)) {
    if ((INSTANT_EDIT_FIELDS as readonly string[]).includes(k)) instant[k] = v;
    else if (!sameValue(v, current[k])) moderated[k] = v;
  }
  return { instant, moderated };
};

const splitInstantEdits = async (id: string, edits: Record<string, unknown>) => {
  const keys = Object.keys(edits).filter((k) => !(INSTANT_EDIT_FIELDS as readonly string[]).includes(k));
  let current: Record<string, unknown> = {};
  if (keys.length) {
    const { data } = await supabase.from("products").select(keys.join(",") as any).eq("id", id).maybeSingle();
    current = (data as any) ?? {};
  }
  return partitionEdits(edits, current);
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
  // Standard platform fee applies from the very first listing.
  const platformFeePercent = 15;

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
    .select(PRODUCT_SAFE_COLS as any)
    .single();

  if (error) {
    if (String(error.message || "").includes("PHONE_NOT_VERIFIED")) {
      throw new Error("PHONE_NOT_VERIFIED");
    }
    if (String(error.message || "").includes("PROFANITY_BLOCKED")) {
      throw new Error("PROFANITY_BLOCKED");
    }
    if (error.code === "23514") {
      throw new Error("Unele date nu sunt valide (ex. titlu 5–100 caractere, descriere max. 2000 caractere).");
    }
    handleApiError("Error creating product", error);
  }

  return product as unknown as Product;
};

export const updateProduct = async (
  id: string,
  data: Partial<PublishProductInput> & { is_active?: boolean },
  ownerId: string,
): Promise<Product> => {
  // If listing was rejected, editing+saving = resubmit for moderation.
  const { data: current } = await supabase
    .from("products")
    .select("approval_status")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  const payload: Record<string, unknown> = { ...data };
  if ((current as any)?.approval_status === "rejected") {
    payload.approval_status = "pending";
    payload.flag_reason = null;
    payload.is_active = true;
  }
  // Edits to a live listing are stored separately for review; the live
  // listing keeps its current (approved) data until an admin approves.
  if ((current as any)?.approval_status === "approved") {
    const { is_active, ...rest } = payload;
    const { instant, moderated } = await splitInstantEdits(id, rest);
    const onlyVisibility = Object.keys(moderated).length === 0;
    const livePayload: Record<string, unknown> = { ...instant };
    if (is_active !== undefined) livePayload.is_active = is_active;
    const edits = moderated;
    if (!onlyVisibility) {
      livePayload.pending_edits = edits;
      livePayload.pending_edits_submitted_at = new Date().toISOString();
    }
    const { data: product, error } = await supabase
      .from("products")
      .update(livePayload as never)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select(PRODUCT_SAFE_COLS as any)
      .single();
    if (error && String(error.message || "").includes("PROFANITY_BLOCKED")) throw new Error("PROFANITY_BLOCKED");
    if (error) handleApiError("Error updating product", error);
    if (!onlyVisibility) {
      const title = (product as any)?.title ?? "";
      try {
        await (supabase.rpc as any)("create_user_notification", {
          p_user_id: ownerId,
          p_type: "product_edit_submitted",
          p_title_ro: "Modificări trimise spre aprobare",
          p_title_en: "Changes submitted for review",
          p_description_ro: `Modificările pentru „${title}” au fost trimise spre aprobare. Anunțul rămâne activ cu datele actuale până la verificare.`,
          p_description_en: `Your changes to "${title}" were submitted for review. The listing stays live with its current details until approved.`,
          p_link: "/anunturi",
        });
      } catch { /* non-blocking */ }
    }
    return product as unknown as Product;
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(payload as never)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select(PRODUCT_SAFE_COLS as any)
    .single();

  if (error) {
    handleApiError("Error updating product", error);
  }

  return product as unknown as Product;
};

/**
 * Owners no longer delete listings directly: they submit a deletion request.
 * The listing is hidden from the public immediately and is permanently removed
 * only after an admin confirms it from the admin dashboard.
 */
export const deleteProduct = async (id: string, ownerId: string): Promise<void> => {
  void ownerId; // ownership is verified server-side via auth.uid()
  const { error } = await (supabase.rpc as any)("request_product_deletion", { _id: id });
  if (error) {
    if (typeof error.message === "string" && error.message.includes("PRODUCT_HAS_ACTIVE_RENTALS")) {
      const e = new Error("PRODUCT_HAS_ACTIVE_RENTALS");
      (e as any).code = "PRODUCT_HAS_ACTIVE_RENTALS";
      throw e;
    }
    handleApiError("Error requesting product deletion", error);
  }
};

export const cancelProductDeletionRequest = async (id: string): Promise<void> => {
  const { error } = await (supabase.rpc as any)("cancel_product_deletion_request", { _id: id });
  if (error) handleApiError("Error cancelling deletion request", error);
};


export const getNearbyProducts = async (
  currentProductId: string,
  locationCity: string | null,
  category: string | null,
  limit: number = 8
): Promise<Product[]> => {
  let query = (supabase
    .from("products")
    .select(PRODUCT_SAFE_COLS) as any)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .neq("id", currentProductId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // First try to find products from the same city
  if (locationCity) {
    query = query.eq("location_city", locationCity);
  }

  let { data, error } = await query;

  if (error) {
    handleApiError("Error fetching nearby products", error);
  }

  // If we don't have enough products from the same city, get more from same category
  if ((data?.length || 0) < limit && category) {
    const existingIds = data?.map(p => p.id) || [];
    const { data: categoryData, error: categoryError } = await (supabase
      .from("products")
      .select(PRODUCT_SAFE_COLS) as any)
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .eq("category", category)
      .not("id", "in", `(${[currentProductId, ...existingIds].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - (data?.length || 0));

    if (!categoryError && categoryData) {
      data = [...(data || []), ...categoryData] as any;
    }
  }

  // Final fallback: fill remaining slots with any recent active products
  if ((data?.length || 0) < limit) {
    const existingIds = data?.map(p => p.id) || [];
    const { data: anyData } = await (supabase
      .from("products")
      .select(PRODUCT_SAFE_COLS) as any)
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .not("id", "in", `(${[currentProductId, ...existingIds].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - (data?.length || 0));

    if (anyData) {
      data = [...(data || []), ...anyData] as any;
    }
  }

  return data || [];
};
