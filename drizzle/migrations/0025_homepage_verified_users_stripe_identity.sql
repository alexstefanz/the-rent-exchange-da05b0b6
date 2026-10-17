CREATE OR REPLACE FUNCTION public.get_homepage_activity()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  recent_rentals jsonb;
  totals jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO recent_rentals
  FROM (
    SELECT
      p.title AS product_title, p.title_en AS product_title_en,
      COALESCE(p.images[1], NULL) AS product_image,
      p.location_city AS city, p.slug AS product_slug,
      EXTRACT(EPOCH FROM (now() - r.confirmed_at))::int AS time_ago_seconds
    FROM rentals r
    JOIN products p ON p.id = r.product_id
    WHERE r.status IN ('confirmed','active','completed')
      AND r.confirmed_at IS NOT NULL
      AND r.confirmed_at > now() - interval '7 days'
      AND p.is_active = true AND p.deleted_at IS NULL
    ORDER BY r.confirmed_at DESC LIMIT 5
  ) r;

  SELECT jsonb_build_object(
    'verified_users', (SELECT COUNT(*) FROM profiles WHERE identity_status = 'verified' AND COALESCE(is_banned,false) = false AND COALESCE(is_deactivated,false) = false),
    'avg_rating', (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM product_reviews),
    'total_reviews', (SELECT COUNT(*) FROM product_reviews),
    'total_active_products', (SELECT COUNT(*) FROM products WHERE is_active = true AND approval_status = 'approved' AND deleted_at IS NULL)
  ) INTO totals;

  RETURN jsonb_build_object('recent_rentals', recent_rentals, 'totals', totals);
END;
$function$;