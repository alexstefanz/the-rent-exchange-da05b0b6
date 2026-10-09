import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { MapPin, ArrowRight, ShieldCheck, Loader2, Heart, Star } from "lucide-react";
import { useProducts } from "@/hooks/queries/useProducts";
import { useHomepagePopularProducts } from "@/hooks/queries/useHomepagePopularProducts";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayTitle, getDisplayCategory } from "@/lib/productI18n";
import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, getFavoriteProducts } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePrefetchProduct } from "@/hooks/usePrefetch";
import OwnerProductActions from "@/components/products/OwnerProductActions";

const FeaturedListings = () => {
  const { data: popular, isLoading, isError, refetch } = useHomepagePopularProducts(8);
  // Fallback source used only when the popularity RPC returns too few results
  // (e.g. very early stage of the marketplace).
  const { data: fallback } = useProducts();
  const copy = useUxCopy();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const prefetchProduct = usePrefetchProduct();

  const popularList = popular || [];
  const fallbackList = fallback || [];
  const merged = popularList.length >= 4
    ? popularList
    : [
        ...popularList,
        ...fallbackList.filter((p) => !popularList.some((pp) => pp.id === p.id)),
      ];
  const allProducts = merged;
  const displayProducts = allProducts.slice(0, 8);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getFavoriteProducts().then((favs) => {
      setFavoriteIds(new Set(favs.map((p) => p.id)));
    });
  }, [user]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const productIds = allProducts.map((p) => p.id);
    supabase
      .from("product_reviews")
      .select("product_id, rating")
      .in("product_id", productIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { sum: number; count: number }> = {};
        data.forEach((r) => {
          if (!map[r.product_id]) map[r.product_id] = { sum: 0, count: 0 };
          map[r.product_id].sum += r.rating;
          map[r.product_id].count += 1;
        });
        const avg: Record<string, number> = {};
        const counts: Record<string, number> = {};
        Object.entries(map).forEach(([id, v]) => {
          avg[id] = v.sum / v.count;
          counts[id] = v.count;
        });
        setRatings(avg);
        setReviewCounts(counts);
      });
  }, [allProducts]);

  const handleFavoriteClick = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Trebuie să fii autentificat pentru a adăuga la favorite.", variant: "destructive" });
      return;
    }
    if (togglingIds.has(productId)) return;
    setTogglingIds((prev) => new Set(prev).add(productId));
    try {
      if (favoriteIds.has(productId)) {
        await removeFavoriteProduct(productId);
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
      } else {
        await addFavoriteProduct(productId);
        setFavoriteIds((prev) => new Set(prev).add(productId));
      }
    } catch {
      toast({ title: "Eroare la actualizarea favoritelor.", variant: "destructive" });
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
    }
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{language === "en" ? "Could not load products." : "Nu am putut încărca produsele."}</p>
            <button onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              {language === "en" ? "Retry" : "Reîncearcă"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (allProducts.length === 0) return null;

  const sectionTitle = language === "en" ? "Popular Rentals" : "Închirieri populare";

  return (
    <section className="pt-6 pb-12 md:pt-8 md:pb-16">
      <div className="container">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-2xl">{sectionTitle}</h2>
          <Link
            to="/cauta"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 whitespace-nowrap"
          >
            {copy.common.viewAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayProducts.map((product, index) => {
            const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
            const imageUrl = getOptimizedImageUrl(product.images?.[0] || "/placeholder.svg", isMobile ? "cardMobile" : "card");
            const location = [product.location_city, product.pickup_address].filter(Boolean).join(", ") || "România";
            const isFav = favoriteIds.has(product.id);
            const rating = ratings[product.id];
            const count = reviewCounts[product.id] || 0;

            return (
              <Link
                key={product.id}
                to={getProductUrl(product)}
                onMouseEnter={() => prefetchProduct(product.slug || product.id)}
                onFocus={() => prefetchProduct(product.slug || product.id)}
                onTouchStart={() => prefetchProduct(product.slug || product.id)}
                className="group block transition-all hover:-translate-y-0.5"
              >
                <div className="relative aspect-[3/4] md:aspect-[4/3] overflow-hidden rounded-xl">
                  <img
                    src={imageUrl}
                    alt={getDisplayTitle(product, language)}
                    width={480}
                    height={360}
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.category && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 pl-1 pr-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                      </span>
                      <span className="truncate max-w-[100px]">{getDisplayCategory(product.category, language)}</span>
                    </span>
                  )}
                  <button
                    onClick={(e) => handleFavoriteClick(e, product.id)}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
                  >
                    <Heart className={cn("h-[18px] w-[18px] transition-colors", isFav ? "fill-primary text-primary" : "text-foreground/70")} />
                  </button>
                  {user?.id === product.owner_id && (
                    <OwnerProductActions productId={product.id} productTitle={getDisplayTitle(product, language)} variant="card" onDeleted={() => refetch()} />
                  )}
                  {rating > 0 && (
                    <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{rating.toFixed(1)}</span>
                      {count > 0 && <span className="font-normal text-foreground/70">({count})</span>}
                    </div>
                  )}
                </div>
                <div className="pt-2 px-1 pb-1 flex flex-col">
                  <h3 className="font-heading text-sm md:text-[15px] font-semibold text-foreground line-clamp-1">{getDisplayTitle(product, language)}</h3>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                  <div className="mt-1.5">
                    <span className="font-heading text-base font-bold text-foreground">{clientPrice} RON</span>
                    <span className="text-xs text-muted-foreground"> {copy.common.perDay}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
