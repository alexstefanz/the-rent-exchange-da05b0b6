DROP FUNCTION IF EXISTS public.get_owner_rentals(uuid);

CREATE OR REPLACE FUNCTION public.get_owner_rentals(owner_uuid uuid)
 RETURNS TABLE(id uuid, public_id text, product_id uuid, renter_id uuid, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, status text, payment_status text, payment_method text, created_at timestamp with time zone, product_title text, product_image text, renter_name text, renter_avatar text, handover_confirmed_at timestamp with time zone, return_confirmed_at timestamp with time zone, refunded_at timestamp with time zone, dispute_status text, pickup_agreed_at timestamp with time zone, rejection_reason text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.public_id, r.product_id, r.renter_id, r.start_date, r.end_date, r.rental_days,
    r.daily_price, r.subtotal, r.platform_fee, r.owner_payout, r.status,
    r.payment_status, r.payment_method, r.created_at,
    COALESCE(p.title, 'Produs') as product_title,
    p.images[1] as product_image,
    renter.full_name as renter_name,
    renter.avatar_url as renter_avatar,
    r.handover_confirmed_at,
    r.return_confirmed_at,
    r.refunded_at,
    COALESCE(r.dispute_status, 'none') as dispute_status,
    r.pickup_agreed_at,
    r.rejection_reason
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  WHERE r.owner_id = owner_uuid
  ORDER BY r.created_at DESC;
$function$;