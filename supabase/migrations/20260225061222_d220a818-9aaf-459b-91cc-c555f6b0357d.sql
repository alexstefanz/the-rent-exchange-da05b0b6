
DROP FUNCTION IF EXISTS public.get_admin_rentals(text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_rentals(status_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, product_id uuid, product_title text, renter_id uuid, renter_name text, owner_id uuid, owner_name text, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, status text, payment_status text, created_at timestamp with time zone, category text, location_city text)
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
    r.created_at,
    COALESCE(p.category, '-') as category,
    COALESCE(p.location_city, '-') as location_city
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  LEFT JOIN profiles owner ON owner.id = r.owner_id
  WHERE (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
