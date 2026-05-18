
DROP FUNCTION IF EXISTS public.get_admin_users(text, integer, integer);
DROP FUNCTION IF EXISTS public.get_admin_users(text, integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_admin_users(
  search_query text DEFAULT NULL,
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
    (SELECT COUNT(*) FROM public.products pr WHERE pr.owner_id = p.id) AS products_count,
    (SELECT COUNT(*) FROM public.rentals r WHERE r.renter_id = p.id OR r.owner_id = p.id) AS rentals_count,
    COALESCE((SELECT SUM(r.owner_payout) FROM public.rentals r WHERE r.owner_id = p.id AND r.status = 'completed'), 0)::numeric AS total_earned,
    COALESCE((SELECT SUM(r.subtotal + COALESCE(r.platform_fee, 0)) FROM public.rentals r WHERE r.renter_id = p.id AND r.status IN ('completed','confirmed','active')), 0)::numeric AS total_spent,
    p.kyc_status,
    COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id LIMIT 1), 'user') AS user_role,
    COALESCE(p.is_banned, false) AS is_banned,
    p.ban_reason,
    p.banned_at,
    (SELECT COUNT(*) FROM public.user_warnings w WHERE w.user_id = p.id) AS warnings_count,
    (SELECT MAX(w.created_at) FROM public.user_warnings w WHERE w.user_id = p.id) AS last_warning_at
  FROM public.profiles p
  WHERE
    (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL
      OR (status_filter = 'banned' AND COALESCE(p.is_banned, false) = true)
      OR (status_filter = 'warned' AND EXISTS (SELECT 1 FROM public.user_warnings w WHERE w.user_id = p.id))
      OR (status_filter = 'active' AND COALESCE(p.is_banned, false) = false AND NOT EXISTS (SELECT 1 FROM public.user_warnings w WHERE w.user_id = p.id))
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
