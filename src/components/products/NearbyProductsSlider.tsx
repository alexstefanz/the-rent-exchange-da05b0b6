import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Star, Heart, CheckCircle } from "lucide-react";
import { getNearbyProducts, Product, calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteProduct, removeFavoriteProduct, getFavoriteProducts } from "@/features/profile/favoriteProductsApi";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NearbyProductsSliderProps {
  currentProductId: string;
  locationCity: string | null;
  category: string | null;
}

const NearbyProductsSlider = ({ currentProductId, locationCity, category }: NearbyProductsSliderProps) => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await getNearbyProducts(currentProductId, locationCity, category);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching nearby products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentProductId, locationCity, category]);

  // Fetch ratings
  useEffect(() => {
    if (products.length === 0) return;
    const productIds = products.map((p) => p.id);
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
  }, [products]);

  // Fetch favorites
  useEffect(() => {
    if (!user) return;
    getFavoriteProducts().then((favs) => {
      setFavoriteIds(new Set(favs.map((p) => p.id)));
    });
  }, [user]);

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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth || 220;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 3;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  // Mouse drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) hasDragged.current = true;
    el.scrollLeft = scrollLeftStart.current - walk;
  }, []);

  const onMouseUpOrLeave = useCallback(() => {
    isDragging.current = false;
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
  }, []);

  const onCardClick = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (isLoading || products.length === 0) return null;

  const title = locationCity ? copy.nearby.listingsFrom(locationCity) : copy.nearby.similarListings;

  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-2xl">{title}</h2>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll("left")} disabled={!canScrollLeft} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} disabled={!canScrollRight} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:snap-none pb-2 -mb-2 cursor-grab"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => {
            const clientPrice = calculateClientPrice(product.daily_price_owner, product.platform_fee_percent);
            const imageUrl = product.images?.[0] || "/placeholder.svg";
            const location = product.location_city || "România";
            const isFav = favoriteIds.has(product.id);
            const rating = ratings[product.id];
            const count = reviewCounts[product.id] || 0;

            return (
              <Link
                key={product.id}
                to={getProductUrl(product)}
                onClick={onCardClick}
                className="group block shrink-0 snap-start overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover w-[calc(50%-8px)] md:w-[calc(33.333%-11px)]"
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
                  {/* Check badge top-left */}
                  <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-[#F98715]" />
                  </div>
                  {/* Favorite top-right */}
                  <button
                    onClick={(e) => handleFavoriteClick(e, product.id)}
                    className={cn(
                      "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors shadow-sm",
                      isFav ? "bg-[#F98715] hover:bg-[#e07a12]" : "bg-white/90 hover:bg-white"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5 drop-shadow-sm transition-colors", isFav ? "text-white fill-white" : "text-[#F98715]")} />
                  </button>
                  {/* Rating bottom-right */}
                  {rating > 0 && (
                    <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-white text-xs font-medium shadow-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{rating.toFixed(1)}</span>
                      {count > 0 && <span className="opacity-75">({count})</span>}
                    </div>
                  )}
                </div>

                {/* Info below image */}
                <div className="p-3 md:p-4">
                  {product.category && (
                    <span className="inline-block rounded-sm bg-primary px-1.5 py-0.5 text-[9px] md:text-[11px] font-semibold text-primary-foreground mb-1.5 whitespace-nowrap truncate max-w-full">
                      {product.category}
                    </span>
                  )}
                  <h3 className="font-heading text-sm text-foreground line-clamp-2 md:text-base font-bold">{product.title}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading text-base font-bold text-primary">{clientPrice} RON</span>
                    <span className="text-xs text-muted-foreground"> {copy.common.perDay}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NearbyProductsSlider;
