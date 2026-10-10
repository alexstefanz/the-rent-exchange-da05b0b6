import { useEffect, useRef, useState } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  lat: number | null;
  lng: number | null;
  query: string; // "address, city, county"
  onChange: (lat: number | null, lng: number | null) => void;
}

const RO_CENTER = { lat: 45.9432, lng: 24.9668 };

/** Optional map picker: click to drop/move a pickup pin. */
export default function LocationPinPicker({ lat, lng, query, onChange }: Props) {
  const { t } = useLanguage();
  const { ready, error } = useGoogleMaps();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [open, setOpen] = useState(lat != null);

  const placeMarker = (pos: { lat: number; lng: number }) => {
    const g = window.google;
    if (!mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = new g.maps.Marker({ map: mapRef.current, position: pos, draggable: true });
      markerRef.current.addListener("dragend", (e: any) =>
        onChangeRef.current(e.latLng.lat(), e.latLng.lng()),
      );
    } else markerRef.current.setPosition(pos);
  };

  useEffect(() => {
    if (!open || !ready || !divRef.current || mapRef.current) return;
    const g = window.google;
    const hasPin = lat != null && lng != null;
    mapRef.current = new g.maps.Map(divRef.current, {
      center: hasPin ? { lat, lng } : RO_CENTER,
      zoom: hasPin ? 15 : 6,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
    });
    if (hasPin) placeMarker({ lat: lat!, lng: lng! });
    mapRef.current.addListener("click", (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      placeMarker(pos);
      onChangeRef.current(pos.lat, pos.lng);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready]);

  // Center on the chosen city/address when there is no pin yet.
  useEffect(() => {
    if (!mapRef.current || !query.trim() || lat != null) return;
    const g = window.google;
    const id = setTimeout(() => {
      new g.maps.Geocoder().geocode({ address: `${query}, Romania` }, (res: any, status: string) => {
        if (status === "OK" && res?.[0]) {
          mapRef.current.setCenter(res[0].geometry.location);
          mapRef.current.setZoom(14);
        }
      });
    }, 600);
    return () => clearTimeout(id);
  }, [query, ready, open, lat]);

  const reset = () => {
    markerRef.current?.setMap(null);
    markerRef.current = null;
    onChange(null, null);
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full h-12" onClick={() => setOpen(true)}>
        <MapPin className="h-4 w-4 mr-2 text-primary" />
        {t("Marchează locația pe hartă (opțional)", "Pin location on map (optional)")}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("Poziționare pe hartă (opțional)", "Map position (optional)")}</p>
        {lat != null && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t("Resetează pinul", "Reset pin")}
          </Button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-muted-foreground">{t("Harta nu a putut fi încărcată. Poți continua fără ea.", "Map could not load. You can continue without it.")}</p>
      ) : (
        <div ref={divRef} className="h-[300px] w-full rounded-xl border border-border bg-muted" />
      )}
      <p className="text-xs text-muted-foreground">
        {t(
          "Dă click pe hartă pentru a pune pinul; îl poți trage pentru ajustare. Locația exactă e vizibilă chiriașului doar după confirmarea rezervării.",
          "Click the map to drop a pin; drag to adjust. The exact location is shown to the renter only after the booking is confirmed.",
        )}
      </p>
    </div>
  );
}
