CREATE OR REPLACE FUNCTION public.get_admin_products(search_query text DEFAULT NULL::text, status_filter text DEFAULT NULL::text, category_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, category text, subcategory text, daily_price_owner numeric, location_city text, images text[], is_active boolean, admin_flagged boolean, flag_reason text, owner_id uuid, owner_name text, slug text, created_at timestamp with time zone, approval_status text, admin_edited_at timestamp with time zone, admin_edited_by uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id, p.title, p.description, p.category, p.subcategory,
    p.daily_price_owner, p.location_city, p.images, p.is_active,
    p.admin_flagged, p.flag_reason, p.owner_id,
    COALESCE(pr.full_name, 'Utilizator') as owner_name,
    p.slug, p.created_at, p.approval_status,
    p.admin_edited_at, p.admin_edited_by
  FROM products p
  LEFT JOIN profiles pr ON pr.id = p.owner_id
  WHERE 
    p.deleted_at IS NULL
    AND (search_query IS NULL OR p.title ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL 
      OR (status_filter = 'active' AND p.is_active = true AND p.admin_flagged = false)
      OR (status_filter = 'inactive' AND p.is_active = false)
      OR (status_filter = 'flagged' AND p.admin_flagged = true)
      OR (status_filter = 'pending' AND p.approval_status = 'pending')
      OR (status_filter = 'rejected' AND p.approval_status = 'rejected')
    )
    AND (category_filter IS NULL OR p.category = category_filter)
  ORDER BY 
    CASE WHEN p.approval_status = 'pending' THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;