
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS cancel_request_status text,
  ADD COLUMN IF NOT EXISTS cancel_request_initiator uuid,
  ADD COLUMN IF NOT EXISTS cancel_request_reason text,
  ADD COLUMN IF NOT EXISTS cancel_request_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_request_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_request_response_note text;

CREATE OR REPLACE FUNCTION public.request_mutual_cancellation(_rental_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    cancel_request_reason = trim(_reason),
    cancel_request_created_at = now(),
    cancel_request_responded_at = NULL,
    cancel_request_response_note = NULL
  WHERE id = _rental_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_mutual_cancellation(_rental_id uuid, _action text, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _action NOT IN ('approve','reject','withdraw') THEN RAISE EXCEPTION 'invalid_action'; END IF;

  SELECT id, renter_id, owner_id, cancel_request_status, cancel_request_initiator
    INTO r
  FROM public.rentals
  WHERE id = _rental_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF uid <> r.renter_id AND uid <> r.owner_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.cancel_request_status <> 'pending' THEN RAISE EXCEPTION 'no_pending_request'; END IF;

  IF _action = 'withdraw' THEN
    IF uid <> r.cancel_request_initiator THEN RAISE EXCEPTION 'only_initiator_can_withdraw'; END IF;
    UPDATE public.rentals SET
      cancel_request_status = 'rejected',
      cancel_request_responded_at = now(),
      cancel_request_response_note = COALESCE(_note,'Retras de inițiator')
    WHERE id = _rental_id;
    RETURN jsonb_build_object('ok', true, 'final', 'withdrawn');
  END IF;

  IF uid = r.cancel_request_initiator THEN RAISE EXCEPTION 'initiator_cannot_respond'; END IF;

  IF _action = 'reject' THEN
    UPDATE public.rentals SET
      cancel_request_status = 'rejected',
      cancel_request_responded_at = now(),
      cancel_request_response_note = _note
    WHERE id = _rental_id;
    RETURN jsonb_build_object('ok', true, 'final', 'rejected');
  END IF;

  -- approve
  UPDATE public.rentals SET
    cancel_request_status = 'approved',
    cancel_request_responded_at = now(),
    cancel_request_response_note = _note
  WHERE id = _rental_id;
  RETURN jsonb_build_object('ok', true, 'final', 'approved');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_mutual_cancellation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_mutual_cancellation(uuid, text, text) TO authenticated;
