
CREATE OR REPLACE FUNCTION public.get_admin_users(
  search_query text DEFAULT NULL::text,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  status_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone,
  products_count bigint,
  rentals_count bigint,
  total_earned numeric,
  total_spent numeric,
  kyc_status text,
  user_role text,
  is_banned boolean,
  ban_reason text,
  banned_at timestamp with time zone,
  warnings_count bigint,
  last_warning_at timestamp with time zone
)
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
    (SELECT COUNT(*) FROM products WHERE owner_id = p.id) AS products_count,
    (SELECT COUNT(*) FROM rentals WHERE renter_id = p.id OR owner_id = p.id) AS rentals_count,
    COALESCE((SELECT SUM(owner_payout) FROM rentals WHERE owner_id = p.id AND status = 'completed'), 0)::numeric AS total_earned,
    COALESCE((SELECT SUM(subtotal + COALESCE(platform_fee, 0)) FROM rentals WHERE renter_id = p.id AND status IN ('completed','confirmed','active')), 0)::numeric AS total_spent,
    p.kyc_status,
    COALESCE((SELECT role::text FROM user_roles WHERE user_id = p.id LIMIT 1), 'user') AS user_role,
    COALESCE(p.is_banned, false) AS is_banned,
    p.ban_reason,
    p.banned_at,
    (SELECT COUNT(*) FROM user_warnings WHERE user_id = p.id) AS warnings_count,
    (SELECT MAX(created_at) FROM user_warnings WHERE user_id = p.id) AS last_warning_at
  FROM profiles p
  WHERE
    (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL
      OR (status_filter = 'banned' AND COALESCE(p.is_banned, false) = true)
      OR (status_filter = 'warned' AND EXISTS (SELECT 1 FROM user_warnings w WHERE w.user_id = p.id))
      OR (status_filter = 'active' AND COALESCE(p.is_banned, false) = false AND NOT EXISTS (SELECT 1 FROM user_warnings w WHERE w.user_id = p.id))
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
