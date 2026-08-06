import { useCallback, useMemo, useState } from "react";
import { Loader2, Map as MapIcon, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, calculateClientPrice } from "@/features/products/productsApi";
import { useProductsMapPoints } from "@/hooks/queries/useProductsMapPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductCard from "@/components/products/ProductCard";
import MapCanvas, { MapItem } from "./MapCanvas";
import MapDetailPanel from "./MapDetailPanel";

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

  const ids = useMemo(() => products.map((p) => p.id), [products]);
  const { data: points, isLoading: pointsLoading } = useProductsMapPoints(ids);

  const items = useMemo<MapItem[]>(() => {
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

  const withoutPin = products.length - items.length;

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
        <div className="h-full overflow-y-auto px-4 pb-8 pt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {t(
              `${products.length} anunțuri · locații aproximative`,
              `${products.length} listings · approximate locations`,
            )}
          </p>
          {isLoading || pointsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => {
                    if (!points?.[p.id]) return;
                    e.preventDefault();
                    handleSelect(p.id);
                  }}
                  className="cursor-pointer"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
          {withoutPin > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
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
      <div className="relative h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-border">
        {mobilePane === "map" ? (
          <MapCanvas
            className="relative h-full w-full"
            items={items}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={setHoveredId}
          />
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
    <div className="grid h-[calc(100vh-11rem)] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,55%)_minmax(0,45%)]">
      <div className="min-h-0 overflow-hidden rounded-2xl border border-border bg-background">
        {listPanel}
      </div>
      <MapCanvas
        className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-border"
        items={items}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={handleSelect}
        onHover={setHoveredId}
      />
    </div>
  );
};

export default CategoryMapView;
