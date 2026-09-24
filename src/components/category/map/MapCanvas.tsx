import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff, Search } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
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
  focus?: { lat: number; lng: number; zoom: number; key: string } | null;
  showEmpty?: boolean;
  onClearLocation?: () => void;
}

const RO_CENTER = { lat: 45.9432, lng: 24.9668 };
const CLUSTER_PX = 72;

/** Airbnb-like desaturated map palette. */
const MAP_STYLES: any[] = [
  { elementType: "geometry", stylers: [{ color: "#f4f2ee" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#dfe9dc" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#efece7" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fdf6e3" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f0e6cd" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9dced" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8aa6bb" }] },
];

const MapCanvas = ({
  items,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onSearchArea,
  className,
  focus,
  showEmpty,
  onClearLocation,
}: Props) => {
  const { ready, error } = useGoogleMaps();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const fittedRef = useRef<string>("");
  const [moved, setMoved] = useState(false);

  // Init map
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: RO_CENTER,
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
      gestureHandling: "greedy",
      backgroundColor: "#f4f2ee",
      styles: MAP_STYLES,
    });
    mapRef.current.addListener("dragend", () => setMoved(true));
    mapRef.current.addListener("zoom_changed", () => setMoved(true));
  }, [ready]);

  // Fit bounds when the set of items changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const key = `${focus?.key ?? ""}#` + items.map((i) => i.id).sort().join(",");
    if (fittedRef.current === key) return;
    if (items.length === 0) {
      if (!focus) return;
      fittedRef.current = key;
      map.setCenter({ lat: focus.lat, lng: focus.lng });
      map.setZoom(focus.zoom);
      setMoved(false);
      return;
    }
    if (fittedRef.current === key) return;
    fittedRef.current = key;
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach((i) => bounds.extend({ lat: i.lat, lng: i.lng }));
    if (items.length === 1) {
      map.setCenter({ lat: items[0].lat, lng: items[0].lng });
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, { top: 70, bottom: 70, left: 70, right: 70 });
    }
    setMoved(false);
  }, [items, focus, ready]);

  // Render markers (with simple pixel-grid clustering)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const projection = map.getProjection();
      const zoom = map.getZoom() ?? 7;
      const scale = Math.pow(2, zoom);

      const cells = new Map<string, MapItem[]>();
      for (const item of items) {
        let cellKey = item.id;
        if (projection) {
          const p = projection.fromLatLngToPoint(new window.google.maps.LatLng(item.lat, item.lng));
          const x = Math.floor((p.x * scale) / CLUSTER_PX);
          const y = Math.floor((p.y * scale) / CLUSTER_PX);
          cellKey = `${x}:${y}`;
        }
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
          const marker = new window.google.maps.Marker({
            map,
            position: { lat, lng },
            icon: {
              url: pill.url,
              scaledSize: new window.google.maps.Size(pill.size, pill.size),
              anchor: new window.google.maps.Point(pill.size / 2, pill.size / 2),
            },
            zIndex: 10,
          });
          marker.addListener("click", () => {
            const bounds = new window.google.maps.LatLngBounds();
            group.forEach((g) => bounds.extend({ lat: g.lat, lng: g.lng }));
            map.fitBounds(bounds, 80);
            if (map.getZoom() > 16) map.setZoom(16);
          });
          markersRef.current.push(marker);
          return;
        }

        group.forEach((item) => {
          const isActive = item.id === selectedId || item.id === hoveredId;
          const pill = buildPricePill(`${item.price} RON`, isActive ? "active" : "default");
          const marker = new window.google.maps.Marker({
            map,
            position: { lat: item.lat, lng: item.lng },
            icon: {
              url: pill.url,
              scaledSize: new window.google.maps.Size(pill.width, pill.height),
              anchor: new window.google.maps.Point(pill.width / 2, pill.height / 2),
            },
            zIndex: isActive ? 999 : 20,
            optimized: false,
          });
          marker.addListener("click", () => onSelect(item.id));
          marker.addListener("mouseover", () => onHover(item.id));
          marker.addListener("mouseout", () => onHover(null));
          markersRef.current.push(marker);
        });
      });
    };

    draw();
    const listener = map.addListener("idle", draw);
    return () => {
      window.google?.maps?.event?.removeListener(listener);
    };
  }, [items, selectedId, hoveredId, onSelect, onHover, ready]);

  // Pan to selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    map.panTo({ lat: item.lat, lng: item.lng });
    if ((map.getZoom() ?? 7) < 12) map.setZoom(13);
  }, [selectedId, items]);

  const searchThisArea = () => {
    const map = mapRef.current;
    if (!map || !onSearchArea) return;
    const b = map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    onSearchArea({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() });
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
      {showEmpty && ready && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-background px-4 py-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.22)]">
          <p className="text-sm font-semibold text-foreground">
            {t("Niciun anunț în această zonă încă", "No listings in this area yet")}
          </p>
          {onClearLocation && (
            <button type="button" onClick={onClearLocation} className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              {t("Șterge filtrele de locație", "Clear location filters")}
            </button>
          )}
        </div>
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
