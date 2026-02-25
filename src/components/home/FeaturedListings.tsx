import { Link } from "react-router-dom";
import { MapPin, ArrowRight, CheckCircle, Loader2, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/queries/useProducts";
import { calculateClientPrice } from "@/features/products/productsApi";
import { getProductUrl } from "@/lib/slugUtils";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef, useState, useCallback, useEffect } from "react";

const SeeAllCard = ({
  images,
  copy,
}: {
  images: string[];
  copy: any;
}) => {
  const thumbs = images.slice(0, 3);

  return (
    <Link
      to="/cauta"
      className="group block shrink-0 snap-start overflow-hidden rounded-xl bg-muted/40 border border-border transition-all hover:-translate-y-1 hover:shadow-card-hover w-[calc(50%-8px)] md:w-[calc(20%-16px)]"
    >
      <div className="flex flex-col items-center justify-center aspect-[4/3] relative overflow-hidden">
        <div className="relative h-20 w-28 md:h-24 md:w-32">
          {thumbs[0] && (
            <img
              src={thumbs[0]}
              alt=""
              className="absolute left-1/2 top-1/2 h-16 w-16 md:h-20 md:w-20 -translate-x-[70%] -translate-y-[55%] rotate-[-8deg] rounded-lg object-cover shadow-md border border-border"
            />
          )}
          {thumbs[1] && (
            <img
              src={thumbs[1]}
              alt=""
              className="absolute left-1/2 top-1/2 h-16 w-16 md:h-20 md:w-20 -translate-x-[30%] -translate-y-[45%] rotate-[6deg] rounded-lg object-cover shadow-md border border-border"
            />
          )}
          {thumbs[2] && (
            <img
              src={thumbs[2]}
              alt=""
              className="absolute left-1/2 top-1/2 h-14 w-14 md:h-16 md:w-16 -translate-x-[50%] -translate-y-[50%] rotate-[2deg] rounded-lg object-cover shadow-lg border border-border z-10"
            />
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

const ProductRow = ({
  title,
  products,
  allImages,
  copy,
}: {
  title: string;
  products: any[];
  allImages: string[];
  copy: any;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth || 300;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 4;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-10 last:mb-0">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {title}
        </h2>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:snap-none pb-2 -mb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => {
          const clientPrice = calculateClientPrice(
            product.daily_price_owner,
            product.platform_fee_percent
          );
          const imageUrl = product.images?.[0] || "/placeholder.svg";
          const location = product.location_city || "România";

          return (
            <Link
              key={product.id}
              to={getProductUrl(product)}
              className="group block shrink-0 snap-start overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover w-[calc(50%-8px)] md:w-[calc(20%-16px)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm transition-colors hover:bg-black/20"
                >
                  <Heart className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                </button>
              </div>
              <div className="p-3 md:p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-2 md:text-base">
                  {product.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
                <div className="mt-2 md:mt-3">
                  <span className="font-heading text-base font-bold text-primary md:text-lg">
                    {clientPrice} RON
                  </span>
                  <span className="text-xs text-muted-foreground md:text-sm">
                    {copy.common.perDay}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        <SeeAllCard images={allImages} copy={copy} />
      </div>
      </div>
    </div>
  );
};

const FeaturedListings = () => {
  const { data: products, isLoading } = useProducts();
  const copy = useUxCopy();
  const { language } = useLanguage();

  const allProducts = products || [];
  const popularProducts = allProducts.slice(0, 10);
  const topCategoryProducts = allProducts.slice(0, 10);
  const recentProducts = [...allProducts].reverse().slice(0, 10);
  const bestReviewedProducts = allProducts.slice(0, 10);

  const allImages = allProducts
    .flatMap((p) => p.images || [])
    .filter(Boolean)
    .slice(0, 10);

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

  if (allProducts.length === 0) return null;

  const sections = [
    {
      title: copy.home.featuredListings,
      products: popularProducts,
    },
    {
      title: language === "en" ? "Most Searched Categories" : "Cele mai căutate categorii",
      products: topCategoryProducts,
    },
    {
      title: language === "en" ? "Most Recent" : "Cele mai recente",
      products: recentProducts,
    },
    {
      title: language === "en" ? "Best Reviews" : "Cele mai bune review-uri",
      products: bestReviewedProducts,
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {sections.map((section) => (
          <ProductRow
            key={section.title}
            title={section.title}
            products={section.products}
            allImages={allImages}
            copy={copy}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedListings;
