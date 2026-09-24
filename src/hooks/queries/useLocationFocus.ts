import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LocationFocus {
  lat: number;
  lng: number;
  zoom: number;
  key: string;
}

/** Map center for the chosen county / town (no Google calls — uses stored coordinates). */
export const useLocationFocus = (judet?: string, city?: string) => {
  const hasCity = Boolean(city && city !== "all");
  const hasJudet = Boolean(judet && judet !== "all");
  return useQuery<LocationFocus | null>({
    queryKey: ["location-focus", judet ?? "all", city ?? "all"],
    enabled: hasCity || hasJudet,
    staleTime: Infinity,
    queryFn: async () => {
      let q = supabase.from("ro_city_coords").select("lat,lng");
      if (hasCity) q = q.eq("city", city!);
      if (hasJudet) q = q.eq("judet", judet!);
      const { data, error } = await q;
      if (error || !data?.length) return null;
      const lat = data.reduce((s, r) => s + Number(r.lat), 0) / data.length;
      const lng = data.reduce((s, r) => s + Number(r.lng), 0) / data.length;
      return { lat, lng, zoom: hasCity ? 12 : 9, key: `${judet}|${city}` };
    },
  });
};
