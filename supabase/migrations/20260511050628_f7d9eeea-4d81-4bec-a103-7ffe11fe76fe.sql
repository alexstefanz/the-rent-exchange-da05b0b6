
-- 7. RPC: confirm_pickup (the other party confirms — sets pickup_agreed_at)
CREATE OR REPLACE FUNCTION public.confirm_pickup(_rental_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  is_owner boolean;
  proposal jsonb;
  both_done boolean;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = _rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF auth.uid() <> r.owner_id AND auth.uid() <> r.renter_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  is_owner := auth.uid() = r.owner_id;
  proposal := COALESCE(r.pickup_proposal, '{}'::jsonb);
  IF is_owner THEN
    proposal := proposal || jsonb_build_object('owner_confirmed_at', to_jsonb(now()));
  ELSE
    proposal := proposal || jsonb_build_object('renter_confirmed_at', to_jsonb(now()));
  END IF;
  both_done := (proposal->>'owner_confirmed_at') IS NOT NULL
       AND (proposal->>'owner_confirmed_at') <> 'null'
       AND (proposal->>'renter_confirmed_at') IS NOT NULL
       AND (proposal->>'renter_confirmed_at') <> 'null';
  UPDATE rentals
    SET pickup_proposal = proposal,
        pickup_agreed_at = CASE WHEN both_done THEN now() ELSE pickup_agreed_at END,
        updated_at = now()
    WHERE id = _rental_id;
  RETURN proposal;
END;
$$;

-- 8. RPC: open_rental_dispute
CREATE OR REPLACE FUNCTION public.open_rental_dispute(
  _rental_id uuid,
  _phase text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  UPDATE rentals
    SET dispute_status = 'open',
        dispute_opened_at = now(),
        dispute_phase = _phase,
        dispute_reason = _reason,
        dispute_opened_by = auth.uid(),
        updated_at = now()
    WHERE id = _rental_id;
END;
$$;

-- 9. RPC: resolve_rental_dispute (admin only)
CREATE OR REPLACE FUNCTION public.resolve_rental_dispute(_rental_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE rentals
    SET dispute_status = 'resolved',
        updated_at = now()
    WHERE id = _rental_id;
END;
$$;

-- 10. Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_inspections;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
