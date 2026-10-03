CREATE OR REPLACE FUNCTION public.confirm_pickup(_rental_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record; is_owner boolean; proposal jsonb; both_done boolean;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = _rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF auth.uid() <> r.owner_id AND auth.uid() <> r.renter_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  is_owner := auth.uid() = r.owner_id;
  proposal := COALESCE(r.pickup_proposal, '{}'::jsonb);
  IF is_owner THEN
    proposal := proposal || jsonb_build_object('owner_confirmed_at', to_jsonb(now()));
  ELSE
    proposal := proposal || jsonb_build_object('renter_confirmed_at', to_jsonb(now()));
  END IF;
  both_done := (proposal->>'owner_confirmed_at') IS NOT NULL AND (proposal->>'owner_confirmed_at') <> 'null'
       AND (proposal->>'renter_confirmed_at') IS NOT NULL AND (proposal->>'renter_confirmed_at') <> 'null';
  PERFORM set_config('app.bypass_renter_lock', 'on', true);
  UPDATE rentals SET pickup_proposal = proposal,
        pickup_agreed_at = CASE WHEN both_done THEN now() ELSE pickup_agreed_at END,
        updated_at = now()
    WHERE id = _rental_id;
  PERFORM set_config('app.bypass_renter_lock', 'off', true);
  RETURN proposal;
END;
$function$;

CREATE OR REPLACE FUNCTION public.propose_pickup(_rental_id uuid, _pickup_time timestamp with time zone, _pickup_place text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record; is_owner boolean; proposal jsonb;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = _rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF auth.uid() <> r.owner_id AND auth.uid() <> r.renter_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  is_owner := auth.uid() = r.owner_id;
  proposal := jsonb_build_object(
    'proposed_by', CASE WHEN is_owner THEN 'owner' ELSE 'renter' END,
    'proposed_at', now(), 'time', _pickup_time, 'place', _pickup_place,
    'owner_confirmed_at', CASE WHEN is_owner THEN to_jsonb(now()) ELSE 'null'::jsonb END,
    'renter_confirmed_at', CASE WHEN NOT is_owner THEN to_jsonb(now()) ELSE 'null'::jsonb END
  );
  PERFORM set_config('app.bypass_renter_lock', 'on', true);
  UPDATE rentals SET pickup_proposal = proposal, updated_at = now() WHERE id = _rental_id;
  PERFORM set_config('app.bypass_renter_lock', 'off', true);
  RETURN proposal;
END;
$function$;