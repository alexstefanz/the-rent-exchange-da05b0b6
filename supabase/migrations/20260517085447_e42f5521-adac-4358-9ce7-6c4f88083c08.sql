-- 1. Make the PV handover trigger a no-op (signing PV no longer auto-activates rental)
CREATE OR REPLACE FUNCTION public.tg_pv_handover_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Signing the handover PV no longer auto-confirms physical receipt.
  -- The renter must explicitly call confirm_handover_received().
  RETURN NEW;
END;
$$;

-- 2. RPC for renter to confirm they physically received the product
CREATE OR REPLACE FUNCTION public.confirm_handover_received(_rental_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  pv RECORD;
BEGIN
  SELECT id, renter_id, owner_id, status, handover_confirmed_at
    INTO r
  FROM public.rentals
  WHERE id = _rental_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rental_not_found';
  END IF;

  IF r.renter_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_renter';
  END IF;

  IF r.status IN ('cancelled','rejected','completed') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  IF r.handover_confirmed_at IS NOT NULL THEN
    -- idempotent
    RETURN;
  END IF;

  SELECT owner_signed_at, renter_signed_at
    INTO pv
  FROM public.rental_pv_documents
  WHERE rental_id = _rental_id AND phase = 'handover';

  IF NOT FOUND OR pv.owner_signed_at IS NULL OR pv.renter_signed_at IS NULL THEN
    RAISE EXCEPTION 'pv_not_signed';
  END IF;

  UPDATE public.rentals
  SET handover_confirmed_at = now(),
      status = 'active'
  WHERE id = _rental_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_handover_received(uuid) TO authenticated;