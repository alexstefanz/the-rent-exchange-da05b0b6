import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { getProductUrl } from "@/lib/slugUtils";
import { getDisplayTitle, getDisplayCategory } from "@/lib/productI18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  addFavoriteProduct,
  removeFavoriteProduct,
  isProductFavorite,
} from "@/features/profile/favoriteProductsApi";
import { toast } from "@/components/ui/sonner";

interface Props {
  product: Product;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

/** Airbnb-style listing card used inside the map view. */
const MapProductCard = ({ product, active, onClick, className }: Props) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  const title = getDisplayTitle(product, language);
  const category = getDisplayCategory(product.category, language);
  const price = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
  const image = getOptimizedImageUrl(product.images?.[0] || "/placeholder.svg", "card");

  useEffect(() => {
    if (user) isProductFavorite(product.id).then(setIsFavorite);
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

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error(t("Trebuie să fii autentificat.", "You must be signed in."));
      return;
    }
    try {
      if (isFavorite) {
        await removeFavoriteProduct(product.id);
        setIsFavorite(false);
      } else {
        await addFavoriteProduct(product.id);
        setIsFavorite(true);
      }
    } catch {
      toast.error(t("Eroare la favorite.", "Error updating favorites."));
    }
  };

  return (
    <Link
      to={getProductUrl(product)}
      onClick={onClick}
      className={cn("group block", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          active && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
        )}
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="aspect-[20/19] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={t("Favorite", "Favorites")}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              "h-[22px] w-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
              isFavorite ? "fill-primary text-primary" : "fill-black/40 text-white",
            )}
          />
        </button>
      </div>

      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-foreground">{title}</h3>
          {rating && rating.avg > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-[13px] text-foreground">
              <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
              {rating.avg.toFixed(1)}
            </span>
          )}
        </div>
        <p className="truncate text-[13px] text-muted-foreground">
          {[product.location_city, category].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-[14px] text-foreground">
          <span className="font-semibold">{price} RON</span>
          <span className="text-muted-foreground"> / {t("zi", "day")}</span>
        </p>
      </div>
    </Link>
  );
};

export default MapProductCard;
