import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { getProductUrl } from "@/lib/slugUtils";
import { getDisplayTitle, getDisplayDescription } from "@/lib/productI18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  addFavoriteProduct,
  removeFavoriteProduct,
  isProductFavorite,
} from "@/features/profile/favoriteProductsApi";
import { toast } from "@/components/ui/sonner";
import MapProductCard from "./MapProductCard";

interface Props {
  product: Product;
  similar: Product[];
  onBack: () => void;
  onSelectSimilar: (id: string) => void;
}

const MapDetailPanel = ({
  product,
  similar,
  onBack,
  onSelectSimilar,
  compact = false,
}: Props & { compact?: boolean }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const title = getDisplayTitle(product, language);
  const description = getDisplayDescription(product, language);
  const price = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);

  useEffect(() => {
    if (user) isProductFavorite(product.id).then(setIsFavorite);
  }, [user, product.id]);

  useEffect(() => {
    setRating(null);
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
    <div className={compact ? "flex flex-col" : "flex h-full flex-col"}>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 px-2">
          <ArrowLeft className="h-4 w-4" />
          {t("Înapoi la rezultate", "Back to results")}
        </Button>
      </div>

      <div
        className={
          compact
            ? "px-4 pb-8 pt-4"
            : "scrollbar-hide flex-1 overflow-y-auto px-4 pb-8 pt-4"
        }
      >
        <article className="relative rounded-3xl bg-card p-2.5 shadow-[0_6px_20px_-6px_rgba(0,0,0,0.15)] ring-1 ring-border/50">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={t("Favorite", "Favorites")}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm ring-1 ring-border/50 transition-transform hover:scale-105"
          >
            <Heart
              className={cn("h-[18px] w-[18px]", isFavorite ? "fill-primary text-primary" : "text-foreground")}
            />
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to={getProductUrl(product)} className="block shrink-0 sm:w-[45%]">
              <img
                src={getOptimizedImageUrl(product.images?.[0] || "/placeholder.svg", "card")}
                alt={title}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </Link>
            <div className="min-w-0 flex-1 py-1 pr-10 sm:pr-8">
              <h2 className="font-heading text-lg font-bold leading-snug text-foreground sm:text-xl">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{product.location_city || t("România", "Romania")}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link to={getProductUrl(product)} className="text-base font-semibold text-foreground underline underline-offset-4">
                  {price} RON
                  <span className="font-normal text-muted-foreground"> / {t("zi", "day")}</span>
                </Link>
                {rating && rating.avg > 0 && (
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <span className="text-muted-foreground">·</span>
                    <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                    {rating.avg.toFixed(1)} ({rating.count})
                  </span>
                )}
              </div>
              <Button asChild size="sm" className="mt-4">
                <Link to={getProductUrl(product)}>{t("Vezi anunțul", "View listing")}</Link>
              </Button>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 px-1 pb-1 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {t(
                "Locația afișată pe hartă este aproximativă. Adresa exactă este disponibilă după confirmarea rezervării.",
                "The location shown on the map is approximate. The exact address is shared after the booking is confirmed.",
              )}
            </p>
        </article>

        {similar.length > 0 && (
          <section className="mt-6">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {t("Anunțuri similare în apropiere", "Similar listings nearby")}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 min-[2200px]:grid-cols-3">
              {similar.map((p) => (
                <div key={p.id} onMouseEnter={() => onSelectSimilar(p.id)}>
                  <MapProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MapDetailPanel;
