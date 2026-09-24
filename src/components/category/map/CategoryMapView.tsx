import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useProductsMapPoints } from "@/hooks/queries/useProductsMapPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationFocus } from "@/hooks/queries/useLocationFocus";
const useIsCompact = () => {
  const [compact, setCompact] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setCompact(window.innerWidth < 1024);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return compact;
};
import MapCanvas, { Bounds, MapItem } from "./MapCanvas";
import MapDetailPanel from "./MapDetailPanel";
import MapProductCard from "./MapProductCard";
import MapEmptyState from "./MapEmptyState";

interface Props {
  products: Product[];
  isLoading?: boolean;
  /** Current keyword — the map only shows listings matching it. */
  searchQuery?: string;
  suggestions?: string[];
  onSuggestionClick?: (term: string) => void;
  onClearSearch?: () => void;
  judet?: string;
  city?: string;
  onClearLocation?: () => void;
}

const PAGE_SIZE = 19;


const distanceKm = (a: MapItem, b: MapItem) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

const CategoryMapView = ({
  products,
  isLoading,
  searchQuery,
  suggestions,
  onSuggestionClick,
  onClearSearch,
  judet,
  city,
  onClearLocation,
}: Props) => {

  const { t } = useLanguage();
  const isCompact = useIsCompact();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [areaBounds, setAreaBounds] = useState<Bounds | null>(null);
  const [page, setPage] = useState(1);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const compactScrollRef = useRef<HTMLDivElement | null>(null);

  const { data: focus } = useLocationFocus(judet, city);
  const ids = useMemo(() => products.map((p) => p.id), [products]);
  const { data: points, isLoading: pointsLoading } = useProductsMapPoints(ids);

  const allItems = useMemo<MapItem[]>(() => {
    if (!points) return [];
    return products
      .filter((p) => points[p.id])
      .map((p) => ({
        id: p.id,
        lat: points[p.id].approx_lat,
        lng: points[p.id].approx_lng,
        price: calculateClientPrice(p.daily_price_owner, p.platform_fee_percent),
      }));
  }, [products, points]);

  const inArea = useCallback(
    (i: MapItem) =>
      !areaBounds ||
      (i.lat <= areaBounds.north &&
        i.lat >= areaBounds.south &&
        i.lng <= areaBounds.east &&
        i.lng >= areaBounds.west),
    [areaBounds],
  );

  const visibleProducts = useMemo(() => {
    if (!areaBounds) return products;
    const ok = new Set(allItems.filter(inArea).map((i) => i.id));
    return products.filter((p) => ok.has(p.id));
  }, [products, allItems, areaBounds, inArea]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [products, areaBounds]);

  // New filter results should not stay hidden behind a previously chosen map area.
  useEffect(() => {
    setAreaBounds(null);
  }, [products]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pagedProducts = useMemo(
    () => visibleProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleProducts, page],
  );

  // Only the current page's listings get pins on the map.
  const items = useMemo(() => {
    const ok = new Set(pagedProducts.map((p) => p.id));
    return allItems.filter((i) => ok.has(i.id));
  }, [allItems, pagedProducts]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  const similar = useMemo(() => {
    if (!selected) return [];
    const origin = items.find((i) => i.id === selected.id);
    // The remaining listings of the current page (max 18) shown 2 per row.
    const candidates = pagedProducts.filter((p) => p.id !== selected.id);
    if (!origin) return candidates;
    return candidates
      .map((p) => {
        const it = items.find((i) => i.id === p.id);
        return { p, d: it ? distanceKm(origin, it) : Number.MAX_SAFE_INTEGER };
      })
      .sort((a, b) => a.d - b.d)
      .map((x) => x.p);
  }, [selected, pagedProducts, items]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    listScrollRef.current?.scrollTo({ top: 0 });
    window.requestAnimationFrame(() => {
      compactScrollRef.current?.scrollTo({ top: window.innerHeight * 0.35, behavior: "smooth" });
    });
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(p);
    setSelectedId(null);
    listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const withoutPin = pagedProducts.length - items.length;

  const pagination = totalPages > 1 && (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        disabled={page === 1}
        onClick={() => goToPage(page - 1)}
        aria-label={t("Pagina anterioară", "Previous page")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(
          (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
        )
        .reduce<(number | "gap")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("gap");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              className={cn(
                "h-9 min-w-9 rounded-full px-3 text-sm transition-colors",
                p === page
                  ? "bg-foreground font-semibold text-background"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        disabled={page === totalPages}
        onClick={() => goToPage(page + 1)}
        aria-label={t("Pagina următoare", "Next page")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const listPanel = (
    <div className={isCompact ? "flex flex-col" : "flex h-full flex-col"}>
      {selected ? (
        <MapDetailPanel
          compact={isCompact}
          product={selected}
          similar={similar}
          onBack={() => setSelectedId(null)}
          onSelectSimilar={(id) => setHoveredId(id)}
        />
      ) : (
        <div
          ref={listScrollRef}
          className={cn(
            "scrollbar-hide px-5 pb-10 pt-4 lg:px-6",
            !isCompact && "h-full overflow-y-auto",
          )}
        >
          <h2 className="text-[15px] font-semibold text-foreground">
            {searchQuery
              ? t(
                  `${visibleProducts.length} anunțuri pentru „${searchQuery}”`,
                  `${visibleProducts.length} listings for “${searchQuery}”`,
                )
              : t(
                  `${visibleProducts.length} anunțuri disponibile`,
                  `${visibleProducts.length} listings available`,
                )}
          </h2>
          <p className="mb-4 text-[13px] text-muted-foreground">
            {t("Locațiile afișate sunt aproximative", "Displayed locations are approximate")}
          </p>
          {isLoading || pointsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pagedProducts.length === 0 ? (
            <MapEmptyState
              searchQuery={searchQuery}
              suggestions={suggestions}
              onSuggestionClick={onSuggestionClick}
              onClearSearch={onClearSearch}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7 min-[2200px]:grid-cols-3">
              {pagedProducts.map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <MapProductCard
                    product={p}
                    active={hoveredId === p.id}
                    onClick={(e) => {
                      if (!points?.[p.id]) return;
                      e.preventDefault();
                      handleSelect(p.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {withoutPin > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              {t(
                `${withoutPin} anunțuri nu au o locație pe hartă, dar apar în listă.`,
                `${withoutPin} listings have no map location but are shown in the list.`,
              )}
            </p>
          )}
          {pagination}
        </div>
      )}
    </div>
  );

  if (isCompact) {
    return (
      <div
        ref={compactScrollRef}
        className="scrollbar-hide h-[calc(100dvh-4rem)] overflow-y-auto bg-muted/30"
      >
        <div className="sticky top-0 z-0 h-[45vh] md:h-[40vh]">
          <MapCanvas
            className="relative h-full w-full overflow-hidden rounded-[30px]"
            items={items}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={setHoveredId}
            onSearchArea={setAreaBounds}
            focus={focus ?? null}
            showEmpty={!isLoading && !pointsLoading && !!focus && items.length === 0}
            onClearLocation={onClearLocation}
          />
        </div>
        <div className="relative z-10 -mt-5 rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          {listPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] w-full grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
      <div className="min-h-0 overflow-hidden bg-background">{listPanel}</div>
      <div className="sticky top-16 h-[calc(100vh-4rem)] min-h-0 self-start">
        <MapCanvas
          className="relative h-full min-h-0 overflow-hidden rounded-[30px]"
          items={items}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={handleSelect}
          onHover={setHoveredId}
          onSearchArea={setAreaBounds}
        />
      </div>
    </div>
  );
};

export default CategoryMapView;
