import { supabase } from "./supabase";

export type Product = {
  id: string;
  owner_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  title_en: string | null;
  description_en: string | null;
  price_per_day: number;
  location_city: string | null;
  location_country: string | null;
  images: string[];
  category: string | null;
  subcategory: string | null;
  status: string | null;
};

export type ProductFilters = {
  search?: string | null;
  category?: string | null;
  subcategory?: string | null;
  location_city?: string | null;
};

/** Listare / căutare produse — folosește același RPC ca web app-ul (diacritic-insensitive). */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const { data, error } = await supabase.rpc("search_products", {
    _search: filters.search?.trim() || null,
    _search_terms: null,
    _category: filters.category || null,
    _subcategory: filters.subcategory || null,
    _location_city: filters.location_city || null,
  });
  if (error) throw error;
  return (data as Product[]) ?? [];
}

/** Produse populare pentru home (aceeași logică de scoring ca pe web). */
export async function listPopularProducts(): Promise<Product[]> {
  const { data, error } = await supabase.rpc("get_homepage_popular_products");
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
}

export async function getMyProfile() {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMyConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Abonare realtime la mesajele unei conversații (sincronizare instant cu web app-ul). */
export function subscribeToMessages(conversationId: string, onInsert: (row: any) => void) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}