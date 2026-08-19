import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";
import { Product, PRODUCT_SAFE_COLS } from "@/features/products/productsApi";

export const addFavoriteProduct = async (productId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite_products")
    .insert({
      user_id: user.id,
      product_id: productId,
    });

  if (error) {
    if (error.code === '23505') return; // Already favorited
    handleApiError("Error adding favorite product", error);
  }
};

export const removeFavoriteProduct = async (productId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite_products")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    handleApiError("Error removing favorite product", error);
  }
};

export const isProductFavorite = async (productId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("favorite_products")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }

  return !!data;
};

export const getFavoriteProducts = async (): Promise<Product[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: favorites, error: favError } = await supabase
    .from("favorite_products")
    .select("product_id")
    .eq("user_id", user.id);

  if (favError || !favorites || favorites.length === 0) return [];

  const productIds = favorites.map((f: any) => f.product_id);

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select(PRODUCT_SAFE_COLS as any)
    .in("id", productIds);

  if (prodError) {
    console.error("Error fetching favorite products:", prodError);
    return [];
  }

  return (products as Product[]) || [];
};
