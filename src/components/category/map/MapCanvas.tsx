import { useEffect, useRef } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildClusterPill, buildPricePill } from "./priceMarker";

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  price: number;
}

interface Props {
  items: MapItem[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  className?: string;
}

const RO_CENTER = { lat: 45.9432, lng: 24.9668 };
const CLUSTER_PX = 64;

const MapCanvas = ({ items, selectedId, hoveredId, onSelect, onHover, className }: Props) => {
  const { ready, error } = useGoogleMaps();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const fittedRef = useRef<string>("");

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
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [ready]);

  // Fit bounds when the set of items changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || items.length === 0) return;
    const key = items.map((i) => i.id).sort().join(",");
    if (fittedRef.current === key) return;
    fittedRef.current = key;
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach((i) => bounds.extend({ lat: i.lat, lng: i.lng }));
    if (items.length === 1) {
      map.setCenter({ lat: items[0].lat, lng: items[0].lng });
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [items]);

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
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
