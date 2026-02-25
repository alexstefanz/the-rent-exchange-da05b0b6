
CREATE OR REPLACE FUNCTION public.get_admin_users(search_query text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, phone text, created_at timestamp with time zone, products_count bigint, rentals_count bigint, kyc_status text, user_role text)
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
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.phone,
    p.created_at,
    (SELECT COUNT(*) FROM products WHERE owner_id = p.id) as products_count,
    (SELECT COUNT(*) FROM rentals WHERE renter_id = p.id OR owner_id = p.id) as rentals_count,
    p.kyc_status,
    COALESCE((SELECT role::text FROM user_roles WHERE user_id = p.id LIMIT 1), 'user') as user_role
  FROM profiles p
  WHERE (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
