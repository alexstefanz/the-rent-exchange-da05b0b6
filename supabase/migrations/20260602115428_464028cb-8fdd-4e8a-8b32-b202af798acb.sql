
CREATE OR REPLACE FUNCTION public.confirm_rental_handover(_rental_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_renter uuid;
  v_status text;
  v_handover timestamptz;
  v_owner_ok boolean;
  v_renter_ok boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT owner_id, renter_id, status, handover_confirmed_at
    INTO v_owner, v_renter, v_status, v_handover
  FROM public.rentals
  WHERE id = _rental_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;

  IF v_uid <> v_owner AND v_uid <> v_renter THEN
    RAISE EXCEPTION 'Nu ai permisiunea să confirmi această rezervare';
  END IF;

  IF v_handover IS NOT NULL THEN
    RAISE EXCEPTION 'Predarea este deja confirmată';
  END IF;

  IF v_status NOT IN ('confirmed','pending_handover','active') THEN
    RAISE EXCEPTION 'Rezervarea nu este în starea potrivită pentru confirmare (status: %)', v_status;
  END IF;

  SELECT
    EXISTS (
      SELECT 1 FROM public.rental_inspections
      WHERE rental_id = _rental_id AND phase = 'checkout' AND role = 'owner'
        AND coalesce(array_length(photos,1),0) >= 3
    ),
    EXISTS (
      SELECT 1 FROM public.rental_inspections
      WHERE rental_id = _rental_id AND phase = 'checkout' AND role = 'renter'
        AND coalesce(array_length(photos,1),0) >= 3
    )
  INTO v_owner_ok, v_renter_ok;

  IF NOT (v_owner_ok AND v_renter_ok) THEN
    RAISE EXCEPTION 'PV_INCOMPLETE_HANDOVER';
  END IF;

  UPDATE public.rentals
     SET handover_confirmed_at = now(),
         status = 'active',
         updated_at = now()
   WHERE id = _rental_id;

  RETURN _rental_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_rental_handover(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_rental_return(_rental_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_renter uuid;
  v_status text;
  v_handover timestamptz;
  v_return timestamptz;
  v_owner_ok boolean;
  v_renter_ok boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT owner_id, renter_id, status, handover_confirmed_at, return_confirmed_at
    INTO v_owner, v_renter, v_status, v_handover, v_return
  FROM public.rentals
  WHERE id = _rental_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;

  IF v_uid <> v_owner AND v_uid <> v_renter THEN
    RAISE EXCEPTION 'Nu ai permisiunea să confirmi această rezervare';
  END IF;

  IF v_handover IS NULL THEN
    RAISE EXCEPTION 'Predarea nu a fost confirmată încă';
  END IF;

  IF v_return IS NOT NULL THEN
    RAISE EXCEPTION 'Returul este deja confirmat';
  END IF;

  IF v_status NOT IN ('active') THEN
    RAISE EXCEPTION 'Rezervarea nu este activă (status: %)', v_status;
  END IF;

  SELECT
    EXISTS (
      SELECT 1 FROM public.rental_inspections
      WHERE rental_id = _rental_id AND phase = 'checkin' AND role = 'owner'
        AND coalesce(array_length(photos,1),0) >= 3
    ),
    EXISTS (
      SELECT 1 FROM public.rental_inspections
      WHERE rental_id = _rental_id AND phase = 'checkin' AND role = 'renter'
        AND coalesce(array_length(photos,1),0) >= 3
    )
  INTO v_owner_ok, v_renter_ok;

  IF NOT (v_owner_ok AND v_renter_ok) THEN
    RAISE EXCEPTION 'PV_INCOMPLETE_RETURN';
  END IF;

  UPDATE public.rentals
     SET return_confirmed_at = now(),
         completed_at = now(),
         status = 'completed',
         updated_at = now()
   WHERE id = _rental_id;

  RETURN _rental_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_rental_return(uuid) TO authenticated;
