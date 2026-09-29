CREATE OR REPLACE FUNCTION public.open_rental_dispute(_rental_id uuid, _phase text, _reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = _rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF auth.uid() <> r.owner_id AND auth.uid() <> r.renter_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF _phase NOT IN ('handover','return') THEN
    RAISE EXCEPTION 'INVALID_PHASE';
  END IF;
  IF length(coalesce(_reason,'')) < 20 THEN
    RAISE EXCEPTION 'REASON_TOO_SHORT';
  END IF;

  PERFORM set_config('app.bypass_renter_lock', 'on', true);

  UPDATE rentals
    SET dispute_status = 'open',
        dispute_opened_at = now(),
        dispute_phase = _phase,
        dispute_reason = _reason,
        dispute_opened_by = auth.uid(),
        updated_at = now()
    WHERE id = _rental_id;

  PERFORM set_config('app.bypass_renter_lock', 'off', true);
END;
$function$;