import { useCallback, useMemo, useState } from "react";
import { Loader2, Map as MapIcon, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useProductsMapPoints } from "@/hooks/queries/useProductsMapPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MapCanvas, { Bounds, MapItem } from "./MapCanvas";
import MapDetailPanel from "./MapDetailPanel";
import MapProductCard from "./MapProductCard";

interface Props {
  products: Product[];
  isLoading?: boolean;
}

const distanceKm = (a: MapItem, b: MapItem) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

const CategoryMapView = ({ products, isLoading }: Props) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"map" | "list">("map");
  const [areaBounds, setAreaBounds] = useState<Bounds | null>(null);

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

  const items = allItems;
  const visibleProducts = useMemo(() => {
    if (!areaBounds) return products;
    const ok = new Set(allItems.filter(inArea).map((i) => i.id));
    return products.filter((p) => ok.has(p.id));
  }, [products, allItems, areaBounds, inArea]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  const similar = useMemo(() => {
    if (!selected) return [];
    const origin = items.find((i) => i.id === selected.id);
    const candidates = products.filter(
      (p) =>
        p.id !== selected.id &&
        (p.subcategory === selected.subcategory || p.category === selected.category),
    );
    if (!origin) return candidates.slice(0, 6);
    return candidates
      .map((p) => {
        const it = items.find((i) => i.id === p.id);
        return { p, d: it ? distanceKm(origin, it) : Number.MAX_SAFE_INTEGER };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((x) => x.p);
  }, [selected, products, items]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setMobilePane("list");
  }, []);

  const withoutPin = visibleProducts.length - allItems.filter(inArea).length;

  const listPanel = (
    <div className="flex h-full flex-col">
      {selected ? (
        <MapDetailPanel
          product={selected}
          similar={similar}
          onBack={() => setSelectedId(null)}
          onSelectSimilar={(id) => setHoveredId(id)}
        />
      ) : (
        <div className="h-full overflow-y-auto px-5 pb-10 pt-4 lg:px-6">
          <h2 className="text-[15px] font-semibold text-foreground">
            {t(
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
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((p) => (
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
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative h-[calc(100dvh-4rem)] overflow-hidden">
        {mobilePane === "map" ? (
          <>
            <MapCanvas
              className="relative h-full w-full"
              items={items}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
              onSearchArea={setAreaBounds}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {visibleProducts.slice(0, 20).map((p) => (
                <div
                  key={p.id}
                  className="pointer-events-auto w-[68vw] shrink-0 rounded-2xl bg-background p-2.5 shadow-[0_4px_18px_rgba(0,0,0,0.18)]"
                >
                  <MapProductCard product={p} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full bg-background">{listPanel}</div>
        )}
        <Button
          onClick={() => setMobilePane(mobilePane === "map" ? "list" : "map")}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 gap-2 rounded-full shadow-lg"
        >
          {mobilePane === "map" ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          {mobilePane === "map" ? t("Listă", "List") : t("Hartă", "Map")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] w-full grid-cols-1 lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
      <div className="min-h-0 overflow-hidden bg-background">{listPanel}</div>
      <MapCanvas
        className="relative h-full min-h-0 overflow-hidden"
        items={items}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={handleSelect}
        onHover={setHoveredId}
        onSearchArea={setAreaBounds}
      />
    </div>
  );
};

export default CategoryMapView;
