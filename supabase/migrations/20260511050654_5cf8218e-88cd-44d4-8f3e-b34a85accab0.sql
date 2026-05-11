
CREATE OR REPLACE FUNCTION public.propose_pickup(
  _rental_id uuid,
  _pickup_time timestamptz,
  _pickup_place text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  is_owner boolean;
  proposal jsonb;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = _rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF auth.uid() <> r.owner_id AND auth.uid() <> r.renter_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  is_owner := auth.uid() = r.owner_id;
  proposal := jsonb_build_object(
    'proposed_by', CASE WHEN is_owner THEN 'owner' ELSE 'renter' END,
    'proposed_at', now(),
    'time', _pickup_time,
    'place', _pickup_place,
    'owner_confirmed_at', CASE WHEN is_owner THEN to_jsonb(now()) ELSE 'null'::jsonb END,
    'renter_confirmed_at', CASE WHEN NOT is_owner THEN to_jsonb(now()) ELSE 'null'::jsonb END
  );
  UPDATE rentals SET pickup_proposal = proposal, updated_at = now() WHERE id = _rental_id;
  RETURN proposal;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.propose_pickup(uuid, timestamptz, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_pickup(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.open_rental_dispute(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resolve_rental_dispute(uuid) FROM anon;
