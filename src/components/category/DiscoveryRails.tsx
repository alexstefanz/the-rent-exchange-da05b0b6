import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Flame, MapPin } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/features/products/productsApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface RailProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  slidesPerView?: 2 | 4;
  viewMode?: "gallery" | "list";
}

const Rail = ({ title, icon, products, slidesPerView = 4, viewMode = "gallery" }: RailProps) => {
  const { t } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (products.length === 0) return null;

  const basisClass = slidesPerView === 2
    ? "shrink-0 basis-[48%] sm:basis-[42%] md:basis-[32%] lg:basis-[24%]"
    : "shrink-0 basis-[68%] sm:basis-[42%] md:basis-[32%] lg:basis-[24%]";

  const isList = viewMode === "list";

  return (
    <section className="space-y-3 motion-safe:animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground inline-flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {!isList && (
        <div className="hidden md:flex items-center gap-1.5">
          <button onClick={scrollPrev} aria-label={t("Anterior", "Previous")}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={scrollNext} aria-label={t("Următor", "Next")}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        )}
      </div>
      {isList ? (
        <div className="flex flex-col gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} viewMode="list" />
          ))}
        </div>
      ) : (
        <div ref={emblaRef} className="overflow-hidden -mx-1">
          <div className="flex gap-4 px-1">
            {products.map((p) => (
              <div key={p.id} className={basisClass}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export const DiscoveryRailsTop = ({ newArrivals, viewMode }: { newArrivals: Product[]; viewMode?: "gallery" | "list" }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">
      <Rail
        title={t("Adăugate recent", "Newly added")}
        icon={<Sparkles className="h-5 w-5 text-primary" />}
        products={newArrivals}
        viewMode={viewMode}
      />
    </div>
  );
};

export const DiscoveryRailsBottom = ({ trending, nearby, viewMode }: { trending: Product[]; nearby: Product[]; viewMode?: "gallery" | "list" }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">
      <Rail
        title={t("Trending în categorie", "Trending in category")}
        icon={<Flame className="h-5 w-5 text-primary" />}
        products={trending}
        slidesPerView={2}
        viewMode={viewMode}
      />
      <Rail
        title={t("Aproape de tine", "Near you")}
        icon={<MapPin className="h-5 w-5 text-primary" />}
        products={nearby}
        slidesPerView={2}
        viewMode={viewMode}
      />
    </div>
  );
};

const DiscoveryRails = ({ trending, newArrivals, nearby }: { trending: Product[]; newArrivals: Product[]; nearby: Product[] }) => (
  <div className="space-y-10">
    <DiscoveryRailsTop newArrivals={newArrivals} />
    <DiscoveryRailsBottom trending={trending} nearby={nearby} />
  </div>
);

export default DiscoveryRails;
