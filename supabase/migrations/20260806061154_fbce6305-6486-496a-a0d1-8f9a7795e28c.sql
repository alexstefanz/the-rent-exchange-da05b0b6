CREATE TABLE public.ro_city_coords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  judet text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (city, judet)
);

GRANT SELECT ON public.ro_city_coords TO anon;
GRANT SELECT ON public.ro_city_coords TO authenticated;
GRANT ALL ON public.ro_city_coords TO service_role;

ALTER TABLE public.ro_city_coords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City coordinates are public"
  ON public.ro_city_coords FOR SELECT
  USING (true);

CREATE INDEX idx_ro_city_coords_city ON public.ro_city_coords (city);

CREATE OR REPLACE FUNCTION public.get_products_map_points(_ids uuid[])
RETURNS TABLE (
  id uuid,
  approx_lat numeric,
  approx_lng numeric,
  has_precise boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    ROUND((
      COALESCE(p.pickup_lat, c.lat)
      + ((('x' || substr(md5(p.id::text), 1, 8))::bit(32)::bigint % 1000) - 500) * 0.000012
    )::numeric, 5) AS approx_lat,
    ROUND((
      COALESCE(p.pickup_lng, c.lng)
      + ((('x' || substr(md5(p.id::text), 9, 8))::bit(32)::bigint % 1000) - 500) * 0.000018
    )::numeric, 5) AS approx_lng,
    (p.pickup_lat IS NOT NULL AND p.pickup_lng IS NOT NULL) AS has_precise
  FROM public.products p
  LEFT JOIN LATERAL (
    SELECT rc.lat, rc.lng
    FROM public.ro_city_coords rc
    WHERE rc.city = p.location_city
    LIMIT 1
  ) c ON true
  WHERE p.id = ANY(_ids)
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND p.deleted_at IS NULL
    AND COALESCE(p.pickup_lat, c.lat) IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_products_map_points(uuid[]) TO anon, authenticated;