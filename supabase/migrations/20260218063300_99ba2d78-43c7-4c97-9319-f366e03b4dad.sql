
-- ============================================================
-- FIX 1: Restrict notifications INSERT to service role only
-- Remove the permissive policy that lets any authenticated user
-- insert notifications for any other user (spam/phishing risk)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Only service role (edge functions) can insert notifications now.
-- Client-side code must call edge functions to trigger notifications.

-- ============================================================
-- FIX 2: Add admin role checks inside SECURITY DEFINER functions
-- to prevent any authenticated user from calling admin RPCs directly
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
  RETURNS TABLE(total_users bigint, total_products bigint, total_rentals bigint, active_rentals bigint, revenue_this_month numeric, pending_kyc bigint)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*) FROM rentals) as total_rentals,
    (SELECT COUNT(*) FROM rentals WHERE status = 'active') as active_rentals,
    (SELECT COALESCE(SUM(platform_fee), 0) FROM rentals 
     WHERE created_at >= date_trunc('month', now()) AND payment_status = 'paid') as revenue_this_month,
    (SELECT COUNT(*) FROM kyc_verifications WHERE status = 'pending') as pending_kyc;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_rentals(status_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
  RETURNS TABLE(id uuid, product_id uuid, product_title text, renter_id uuid, renter_name text, owner_id uuid, owner_name text, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, status text, payment_status text, created_at timestamp with time zone)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.product_id,
    COALESCE(p.title, 'Produs șters') as product_title,
    r.renter_id,
    COALESCE(renter.full_name, 'Utilizator') as renter_name,
    r.owner_id,
    COALESCE(owner.full_name, 'Utilizator') as owner_name,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.daily_price,
    r.subtotal,
    r.platform_fee,
    r.owner_payout,
    r.status,
    r.payment_status,
    r.created_at
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  LEFT JOIN profiles owner ON owner.id = r.owner_id
  WHERE (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users(search_query text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
  RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, phone text, created_at timestamp with time zone, products_count bigint, rentals_count bigint, kyc_status text, user_role text)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
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
    NULL::text as phone,
    p.created_at,
    (SELECT COUNT(*) FROM products WHERE owner_id = p.id) as products_count,
    (SELECT COUNT(*) FROM rentals WHERE renter_id = p.id OR owner_id = p.id) as rentals_count,
    COALESCE((SELECT status FROM kyc_verifications WHERE user_id = p.id), 'not_started') as kyc_status,
    COALESCE((SELECT role::text FROM user_roles WHERE user_id = p.id LIMIT 1), 'user') as user_role
  FROM profiles p
  WHERE (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_financial_summary(start_date timestamp with time zone DEFAULT date_trunc('month'::text, now()), end_date timestamp with time zone DEFAULT now())
  RETURNS TABLE(total_revenue numeric, platform_fees numeric, owner_payouts numeric, pending_payments numeric, completed_rentals bigint)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(subtotal), 0) as total_revenue,
    COALESCE(SUM(platform_fee), 0) as platform_fees,
    COALESCE(SUM(owner_payout), 0) as owner_payouts,
    COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN subtotal ELSE 0 END), 0) as pending_payments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rentals
  FROM rentals
  WHERE created_at BETWEEN start_date AND end_date;
END;
$$;
