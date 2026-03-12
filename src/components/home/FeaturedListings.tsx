import { Link } from "react-router-dom";
import { MapPin, ArrowRight, CheckCircle, Loader2, Heart, Star } from "lucide-react";
import { useProducts } from "@/hooks/queries/useProducts";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, getFavoriteProducts } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const SeeAllCard = ({ images, copy }: { images: string[]; copy: any }) => {
  const thumbs = images.slice(0, 3);

  return (
    <Link
      to="/cauta"
      className="group block overflow-hidden rounded-xl bg-muted/40 border border-border transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="flex flex-col items-center justify-center aspect-[4/3] relative overflow-hidden">
        <div className="relative h-20 w-28 md:h-24 md:w-32">
          {thumbs[0] && (
            <img src={thumbs[0]} alt="" className="absolute left-1/2 top-1/2 h-16 w-16 md:h-20 md:w-20 -translate-x-[70%] -translate-y-[55%] rotate-[-8deg] rounded-lg object-cover shadow-md border border-border" />
          )}
          {thumbs[1] && (
            <img src={thumbs[1]} alt="" className="absolute left-1/2 top-1/2 h-16 w-16 md:h-20 md:w-20 -translate-x-[30%] -translate-y-[45%] rotate-[6deg] rounded-lg object-cover shadow-md border border-border" />
          )}
          {thumbs[2] && (
            <img src={thumbs[2]} alt="" className="absolute left-1/2 top-1/2 h-14 w-14 md:h-16 md:w-16 -translate-x-[50%] -translate-y-[50%] rotate-[2deg] rounded-lg object-cover shadow-lg border border-border z-10" />
          )}
        </div>
      </div>
      <div className="p-3 md:p-4 text-center">
        <span className="font-heading text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {copy.common.viewAll}
        </span>
        <ArrowRight className="inline-block ml-1.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
};

const FeaturedListings = () => {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const copy = useUxCopy();
  const { language } = useLanguage();
  const { user } = useAuth();

  const allProducts = products || [];
  const displayProducts = allProducts.slice(0, 7);

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

  const allImages = allProducts.flatMap((p) => p.images || []).filter(Boolean).slice(0, 10);

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
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-2xl mb-6">{sectionTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayProducts.map((product) => {
            const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
            const imageUrl = product.images?.[0] || "/placeholder.svg";
            const location = [product.location_city, product.pickup_address].filter(Boolean).join(", ") || "România";
            const isFav = favoriteIds.has(product.id);
            const rating = ratings[product.id];
            const count = reviewCounts[product.id] || 0;

            return (
              <Link
                key={product.id}
                to={getProductUrl(product)}
                className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
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
                    onClick={(e) => handleFavoriteClick(e, product.id)}
                    className={cn(
                      "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors shadow-sm",
                      isFav ? "bg-[#F98715] hover:bg-[#e07a12]" : "bg-white/90 hover:bg-white"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5 drop-shadow-sm transition-colors", isFav ? "text-white fill-white" : "text-[#F98715]")} />
                  </button>
                  {rating > 0 && (
                    <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-white text-xs font-medium shadow-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{rating.toFixed(1)}</span>
                      {count > 0 && <span className="opacity-75">({count})</span>}
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4">
                  {product.category && (
                    <span className="inline-block rounded bg-primary px-2 py-0.5 text-[10px] md:text-xs font-semibold text-primary-foreground mb-1.5">
                      {product.category}
                    </span>
                  )}
                  <h3 className="font-heading text-sm text-foreground line-clamp-2 md:text-xl font-bold">{product.title}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                  <div className="mt-2 md:mt-3">
                    <span className="font-heading text-base font-bold text-primary md:text-lg">{clientPrice} RON</span>
                    <span className="text-xs text-muted-foreground md:text-sm"> {copy.common.perDay}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          <SeeAllCard images={allImages} copy={copy} />
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
