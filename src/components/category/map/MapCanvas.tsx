import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff, Search } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildClusterPill, buildPricePill } from "./priceMarker";

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  price: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface Props {
  items: MapItem[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onSearchArea?: (bounds: Bounds | null) => void;
  className?: string;
}

const RO_CENTER = { lat: 45.9432, lng: 24.9668 };
const CLUSTER_PX = 72;

const MapCanvas = ({
  items,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onSearchArea,
  className,
}: Props) => {
  const { ready, error } = useMapbox();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const fittedRef = useRef<string>("");
  const [moved, setMoved] = useState(false);

  // Init map
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [RO_CENTER.lng, RO_CENTER.lat],
      zoom: 6,
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("dragend", () => setMoved(true));
    map.on("zoomend", () => setMoved(true));

    mapRef.current = map;
  }, [ready]);

  // Fit bounds when the set of items changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || items.length === 0) return;
    const key = items.map((i) => i.id).sort().join(",");
    if (fittedRef.current === key) return;
    fittedRef.current = key;

    if (items.length === 1) {
      map.setCenter([items[0].lng, items[0].lat]);
      map.setZoom(13);
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      items.forEach((i) => bounds.extend([i.lng, i.lat]));
      map.fitBounds(bounds, { padding: 70, duration: 0 });
    }
    setMoved(false);
  }, [items]);

  // Render markers (simple pixel-grid clustering)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const cells = new Map<string, MapItem[]>();
      for (const item of items) {
        const p = map.project([item.lng, item.lat]);
        const x = Math.floor(p.x / CLUSTER_PX);
        const y = Math.floor(p.y / CLUSTER_PX);
        const cellKey = `${x}:${y}`;
        const arr = cells.get(cellKey);
        if (arr) arr.push(item);
        else cells.set(cellKey, [item]);
      }

      cells.forEach((group) => {
        const hasFocus = group.some((g) => g.id === selectedId || g.id === hoveredId);
        if (group.length > 1 && !hasFocus) {
          const lat = group.reduce((s, g) => s + g.lat, 0) / group.length;
          const lng = group.reduce((s, g) => s + g.lng, 0) / group.length;
          const pill = buildClusterPill(group.length);
          const el = document.createElement("div");
          el.style.width = `${pill.size}px`;
          el.style.height = `${pill.size}px`;
          el.style.backgroundImage = `url('${pill.url}')`;
          el.style.backgroundSize = "contain";
          el.style.backgroundRepeat = "no-repeat";
          el.style.cursor = "pointer";

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([lng, lat])
            .addTo(map);

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const bounds = new mapboxgl.LngLatBounds();
            group.forEach((g) => bounds.extend([g.lng, g.lat]));
            map.fitBounds(bounds, { padding: 80, duration: 300, maxZoom: 16 });
          });

          markersRef.current.push(marker);
          return;
        }

        group.forEach((item) => {
          const isActive = item.id === selectedId || item.id === hoveredId;
          const pill = buildPricePill(`${item.price} RON`, isActive ? "active" : "default");
          const el = document.createElement("div");
          el.style.width = `${pill.width}px`;
          el.style.height = `${pill.height}px`;
          el.style.backgroundImage = `url('${pill.url}')`;
          el.style.backgroundSize = "contain";
          el.style.backgroundRepeat = "no-repeat";
          el.style.cursor = "pointer";
          el.style.zIndex = isActive ? "999" : "20";

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([item.lng, item.lat])
            .addTo(map);

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelect(item.id);
          });
          el.addEventListener("mouseenter", () => onHover(item.id));
          el.addEventListener("mouseleave", () => onHover(null));

          markersRef.current.push(marker);
        });
      });
    };

    draw();
    const onMove = () => draw();
    map.on("moveend", onMove);

    return () => {
      map.off("moveend", onMove);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [items, selectedId, hoveredId, onSelect, onHover, ready]);

  // Pan to selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    map.easeTo({ center: [item.lng, item.lat], zoom: Math.max(map.getZoom() || 7, 13), duration: 300 });
  }, [selectedId, items]);

  const searchThisArea = () => {
    const map = mapRef.current;
    if (!map || !onSearchArea) return;
    const b = map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    onSearchArea({ north: ne.lat, south: sw.lat, east: ne.lng, west: sw.lng });
    setMoved(false);
  };

  if (error) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center">
          <MapPinOff className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("Harta nu a putut fi încărcată.", "The map could not be loaded.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full" />
      {onSearchArea && moved && ready && (
        <button
          type="button"
          onClick={searchThisArea}
          className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.22)] transition-transform hover:scale-[1.03]"
        >
          <Search className="h-4 w-4" />
          {t("Caută în această zonă", "Search this area")}
        </button>
      )}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
