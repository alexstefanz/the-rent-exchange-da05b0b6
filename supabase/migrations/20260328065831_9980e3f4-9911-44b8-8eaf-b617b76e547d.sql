
CREATE OR REPLACE FUNCTION public.get_admin_pending_products(
  search_query text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  category text,
  subcategory text,
  daily_price_owner numeric,
  location_city text,
  location_country text,
  pickup_address text,
  images text[],
  included_items text[],
  is_active boolean,
  admin_flagged boolean,
  flag_reason text,
  owner_id uuid,
  owner_name text,
  slug text,
  created_at timestamptz,
  approval_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id, p.title, p.description, p.category, p.subcategory,
    p.daily_price_owner, p.location_city, p.location_country, p.pickup_address,
    p.images, p.included_items, p.is_active,
    p.admin_flagged, p.flag_reason, p.owner_id,
    COALESCE(pr.full_name, 'Utilizator') as owner_name,
    p.slug, p.created_at, p.approval_status
  FROM products p
  LEFT JOIN profiles pr ON pr.id = p.owner_id
  WHERE p.approval_status = 'pending'
    AND (search_query IS NULL OR p.title ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
