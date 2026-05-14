
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS cancel_request_subject text,
  ADD COLUMN IF NOT EXISTS cancel_request_admin_id uuid,
  ADD COLUMN IF NOT EXISTS cancel_request_admin_note text;

-- Updated request RPC: accepts optional subject
CREATE OR REPLACE FUNCTION public.request_mutual_cancellation(_rental_id uuid, _reason text, _subject text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 10 THEN
    RAISE EXCEPTION 'reason_too_short';
  END IF;
  IF _subject IS NULL OR length(trim(_subject)) < 3 THEN
    RAISE EXCEPTION 'subject_too_short';
  END IF;

  SELECT id, renter_id, owner_id, status, handover_pv_owner_signed_at, cancel_request_status
    INTO r
  FROM public.rentals
  WHERE id = _rental_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF uid <> r.renter_id AND uid <> r.owner_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.status IN ('cancelled','completed','rejected') THEN RAISE EXCEPTION 'rental_closed'; END IF;
  IF r.handover_pv_owner_signed_at IS NOT NULL THEN RAISE EXCEPTION 'handover_signed'; END IF;
  IF r.cancel_request_status = 'pending' THEN RAISE EXCEPTION 'request_already_pending'; END IF;

  UPDATE public.rentals SET
    cancel_request_status = 'pending',
    cancel_request_initiator = uid,
    cancel_request_subject = trim(_subject),
    cancel_request_reason = trim(_reason),
    cancel_request_created_at = now(),
    cancel_request_responded_at = NULL,
    cancel_request_response_note = NULL,
    cancel_request_admin_id = NULL,
    cancel_request_admin_note = NULL
  WHERE id = _rental_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Withdraw RPC (initiator can withdraw their pending request)
CREATE OR REPLACE FUNCTION public.withdraw_cancellation_request(_rental_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT id, cancel_request_status, cancel_request_initiator
    INTO r FROM public.rentals WHERE id = _rental_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF r.cancel_request_status <> 'pending' THEN RAISE EXCEPTION 'no_pending_request'; END IF;
  IF r.cancel_request_initiator <> uid THEN RAISE EXCEPTION 'forbidden'; END IF;

  UPDATE public.rentals SET
    cancel_request_status = 'withdrawn',
    cancel_request_responded_at = now()
  WHERE id = _rental_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Admin response: approve / reject. Approve sets 'approved' (edge function will execute Stripe refund + cancellation); reject sets 'rejected'.
CREATE OR REPLACE FUNCTION public.admin_respond_cancellation(_rental_id uuid, _action text, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT public.has_role(uid, 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'invalid_action'; END IF;

  SELECT id, cancel_request_status INTO r FROM public.rentals WHERE id = _rental_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF r.cancel_request_status <> 'pending' THEN RAISE EXCEPTION 'no_pending_request'; END IF;

  IF _action = 'approve' THEN
    UPDATE public.rentals SET
      cancel_request_status = 'approved',
      cancel_request_admin_id = uid,
      cancel_request_admin_note = NULLIF(trim(coalesce(_note,'')), ''),
      cancel_request_responded_at = now()
    WHERE id = _rental_id;
  ELSE
    UPDATE public.rentals SET
      cancel_request_status = 'rejected',
      cancel_request_admin_id = uid,
      cancel_request_admin_note = NULLIF(trim(coalesce(_note,'')), ''),
      cancel_request_responded_at = now()
    WHERE id = _rental_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'action', _action);
END;
$function$;

-- Admin listing RPC
CREATE OR REPLACE FUNCTION public.list_pending_cancellation_requests()
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
  cancel_request_created_at timestamptz
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
    r.total_days,
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
    r.cancel_request_created_at
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles rp ON rp.id = r.renter_id
  LEFT JOIN public.profiles op ON op.id = r.owner_id
  WHERE r.cancel_request_status = 'pending'
  ORDER BY r.cancel_request_created_at DESC;
END;
$function$;
