import { Link } from "react-router-dom";
import { MapPin, CheckCircle, Heart, Star } from "lucide-react";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProductUrl } from "@/lib/slugUtils";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  product: Product;
  viewMode?: "gallery" | "list";
}

const ProductCard = ({ product, viewMode = "gallery" }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const { user } = useAuth();
  const clientPrice = calculateClientPrice(
    product.daily_price_owner,
    product.platform_fee_percent
  );

  const imageUrl = product.images?.[0] || "/placeholder.svg";
  const location = [product.location_city, product.pickup_address].filter(Boolean).join(", ") || "România";

  useEffect(() => {
    if (user) {
      isProductFavorite(product.id).then(setIsFavorite);
    }
  }, [user, product.id]);

  useEffect(() => {
    supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", product.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const sum = data.reduce((s, r) => s + r.rating, 0);
        setRating({ avg: sum / data.length, count: data.length });
      });
  }, [product.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Trebuie să fii autentificat pentru a adăuga la favorite.", variant: "destructive" });
      return;
    }
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isFavorite) {
        await removeFavoriteProduct(product.id);
        setIsFavorite(false);
      } else {
        await addFavoriteProduct(product.id);
        setIsFavorite(true);
      }
    } catch {
      toast({ title: "Eroare la actualizarea favoritelor.", variant: "destructive" });
    } finally {
      setIsToggling(false);
    }
  };

  if (viewMode === "list") {
    return (
      <Link
        to={getProductUrl(product)}
        className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[4/3] sm:aspect-square sm:w-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={product.title}
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
              <CheckCircle className="h-3.5 w-3.5 text-[#F98715]" />
            </div>
            {rating && rating.avg > 0 && (
              <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-white text-xs font-medium">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating.avg.toFixed(1)}</span>
                <span className="opacity-75">({rating.count})</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            {product.category && (
          <span className="inline-block rounded-sm bg-primary px-1.5 py-0.5 text-[9px] md:text-[11px] font-semibold text-primary-foreground mb-1.5 whitespace-nowrap truncate max-w-full">
                {product.category}
              </span>
            )}
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location}
              </div>
            </div>
            <div className="mt-4">
              <span className="font-heading text-xl font-bold text-primary">
                {clientPrice} RON
              </span>
              <span className="text-sm text-muted-foreground"> / zi</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={getProductUrl(product)}
      className="group relative block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          width={480}
          height={360}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <CheckCircle className="h-3.5 w-3.5 text-[#F98715]" />
        </div>
        <button
          onClick={handleFavoriteClick}
          className={cn("absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors shadow-sm", isFavorite ? "bg-[#F98715] hover:bg-[#e07a12]" : "bg-white/90 hover:bg-white")}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 drop-shadow-sm transition-colors",
              isFavorite ? "text-white fill-white" : "text-[#F98715]"
            )}
          />
        </button>
        {rating && rating.avg > 0 && (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-white text-xs font-medium shadow-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{rating.avg.toFixed(1)}</span>
            {rating.count > 0 && <span className="opacity-75">({rating.count})</span>}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 md:p-4">
        {product.category && (
          <span className="inline-block rounded-sm bg-primary px-1.5 py-0.5 text-[9px] md:text-[11px] font-semibold text-primary-foreground mb-1.5 whitespace-nowrap truncate max-w-full">
            {product.category}
          </span>
        )}
        <h3 className="font-heading text-base md:text-lg font-semibold text-foreground line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-3">
          <span className="font-heading text-lg md:text-xl font-bold text-primary">
            {clientPrice} RON
          </span>
          <span className="text-xs md:text-sm text-muted-foreground"> / zi</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
