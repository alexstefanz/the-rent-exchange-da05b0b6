import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { getFavoriteProducts, removeFavoriteProduct } from "@/features/profile/favoriteProductsApi";
import { Product } from "@/features/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { useUxCopy } from "@/hooks/useUxCopy";
import { toast } from "@/hooks/use-toast";

const FavoritesTab = () => {
  const copy = useUxCopy();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    const data = await getFavoriteProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await removeFavoriteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: copy.favorites?.removed || "Removed from favorites" });
    } catch {
      toast({ title: copy.auth?.errorGeneric || "Error", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {copy.favorites?.empty || "No favorites yet"}
        </h3>
        <p className="text-muted-foreground text-sm max-w-md">
          {copy.favorites?.emptyDesc || "Browse listings and tap the heart icon to save your favorites here."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground mb-6">
        {copy.favorites?.count?.(products.length) || `${products.length} favorite(s)`}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(product.id); }}
              className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
              title={copy.favorites?.remove || "Remove from favorites"}
            >
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesTab;
