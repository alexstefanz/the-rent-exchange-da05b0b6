CREATE OR REPLACE FUNCTION public.list_resolved_cancellation_requests()
RETURNS TABLE(
  rental_id uuid,
  rental_public_id text,
  product_id uuid,
  product_title text,
  product_image text,
  start_date date,
  end_date date,
  total_days integer,
  subtotal numeric,
  platform_fee numeric,
  status text,
  payment_status text,
  renter_id uuid,
  renter_name text,
  renter_email text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  initiator_id uuid,
  initiator_role text,
  cancel_request_subject text,
  cancel_request_reason text,
  cancel_request_created_at timestamp with time zone,
  cancel_request_status text,
  cancel_request_responded_at timestamp with time zone,
  cancel_request_admin_note text,
  cancel_request_response_note text,
  cancel_request_admin_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.public_id,
    r.product_id,
    p.title,
    (CASE WHEN p.images IS NOT NULL AND array_length(p.images,1) > 0 THEN p.images[1] ELSE NULL END)::text,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.platform_fee,
    r.status,
    r.payment_status,
    r.renter_id,
    rp.full_name,
    rp.email,
    r.owner_id,
    op.full_name,
    op.email,
    r.cancel_request_initiator,
    (CASE WHEN r.cancel_request_initiator = r.renter_id THEN 'renter' ELSE 'owner' END)::text,
    r.cancel_request_subject,
    r.cancel_request_reason,
    r.cancel_request_created_at,
    r.cancel_request_status,
    r.cancel_request_responded_at,
    r.cancel_request_admin_note,
    r.cancel_request_response_note,
    r.cancel_request_admin_id
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles rp ON rp.id = r.renter_id
  LEFT JOIN public.profiles op ON op.id = r.owner_id
  WHERE r.cancel_request_status IN ('approved','rejected')
  ORDER BY r.cancel_request_responded_at DESC NULLS LAST
  LIMIT 500;
END;
$function$;