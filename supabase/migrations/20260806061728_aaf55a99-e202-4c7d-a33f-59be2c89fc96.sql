CREATE OR REPLACE FUNCTION public.get_products_map_points(_ids uuid[])
 RETURNS TABLE(id uuid, approx_lat numeric, approx_lng numeric, has_precise boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE lower(public.unaccent(rc.city)) = lower(public.unaccent(coalesce(p.location_city, '')))
    LIMIT 1
  ) c ON true
  WHERE p.id = ANY(_ids)
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND p.deleted_at IS NULL
    AND COALESCE(p.pickup_lat, c.lat) IS NOT NULL;
$function$;