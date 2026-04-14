DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS TABLE(total_users bigint, total_products bigint, total_rentals bigint, active_rentals bigint, revenue_this_month numeric, pending_kyc bigint, total_withdrawn numeric)
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
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*) FROM rentals) as total_rentals,
    (SELECT COUNT(*) FROM rentals WHERE status = 'active') as active_rentals,
    (SELECT COALESCE(SUM(platform_fee), 0) FROM rentals 
     WHERE created_at >= date_trunc('month', now()) AND payment_status = 'paid') as revenue_this_month,
    (SELECT COUNT(*) FROM kyc_cases WHERE status IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW')) as pending_kyc,
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'completed') as total_withdrawn;
END;
$function$;