import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { MapPin, ShieldCheck, Heart, Star } from "lucide-react";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProductUrl } from "@/lib/slugUtils";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, isProductFavorite } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayTitle, getDisplayDescription, getDisplayCategory } from "@/lib/productI18n";

interface ProductCardProps {
  product: Product;
  viewMode?: "gallery" | "list";
}

const ProductCard = ({ product, viewMode = "gallery" }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const displayTitle = getDisplayTitle(product, language);
  const displayDescription = getDisplayDescription(product, language);
  const displayCategory = getDisplayCategory(product.category, language);
  const clientPrice = calculateClientPrice(
    product.daily_price_owner,
    product.platform_fee_percent
  );

  const imageUrl = getOptimizedImageUrl(product.images?.[0] || "/placeholder.svg", "card");
  const location = [product.location_city, product.pickup_address].filter(Boolean).join(", ") || t("România", "Romania");

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
      toast({ title: t("Trebuie să fii autentificat pentru a adăuga la favorite.", "You must be signed in to add favorites."), variant: "destructive" });
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
      toast({ title: t("Eroare la actualizarea favoritelor.", "Error updating favorites."), variant: "destructive" });
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
              alt={displayTitle}
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
          <span className="inline-flex w-fit max-w-max self-start rounded-sm bg-primary px-1.5 py-0.5 text-[9px] md:text-[11px] font-semibold text-primary-foreground mb-1.5 whitespace-nowrap">
                {displayCategory}
              </span>
            )}
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {displayTitle}
            </h3>
            {displayDescription && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {displayDescription}
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
              <span className="text-sm text-muted-foreground"> / {t("zi", "day")}</span>
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
          alt={displayTitle}
          width={480}
          height={360}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.category && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="truncate max-w-[120px]">{displayCategory}</span>
          </span>
        )}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t("Elimină din favorite", "Remove from favorites") : t("Adaugă la favorite", "Add to favorites")}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
        </button>
        {rating && rating.avg > 0 && (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{rating.avg.toFixed(1)}</span>
            {rating.count > 0 && <span className="font-normal text-muted-foreground">({rating.count})</span>}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 flex flex-col">
        <h3 className="font-heading text-sm md:text-base font-semibold text-foreground line-clamp-1">
          {displayTitle}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-2">
          <span className="font-heading text-base md:text-lg font-bold text-foreground">
            {clientPrice} RON
          </span>
          <span className="text-xs text-muted-foreground"> / {t("zi", "day")}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
