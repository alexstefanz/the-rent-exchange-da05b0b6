CREATE OR REPLACE FUNCTION public.request_mutual_cancellation(_rental_id uuid, _reason text, _subject text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r record; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 5 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF _subject IS NULL OR length(trim(_subject)) < 3 THEN RAISE EXCEPTION 'subject_too_short'; END IF;
  SELECT id, renter_id, owner_id, status, handover_confirmed_at, cancel_request_status INTO r
    FROM public.rentals WHERE id = _rental_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF uid <> r.renter_id AND uid <> r.owner_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.status IN ('cancelled','completed','rejected') THEN RAISE EXCEPTION 'rental_closed'; END IF;
  IF r.handover_confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'handover_signed'; END IF;
  IF r.cancel_request_status = 'pending' THEN RAISE EXCEPTION 'request_already_pending'; END IF;
  UPDATE public.rentals SET cancel_request_status = 'pending', cancel_request_initiator = uid,
    cancel_request_reason = trim(_reason), cancel_request_subject = trim(_subject),
    cancel_request_created_at = now(), cancel_request_responded_at = NULL,
    cancel_request_response_note = NULL, cancel_request_admin_id = NULL, cancel_request_admin_note = NULL
  WHERE id = _rental_id;
  RETURN jsonb_build_object('ok', true);
END; $function$;