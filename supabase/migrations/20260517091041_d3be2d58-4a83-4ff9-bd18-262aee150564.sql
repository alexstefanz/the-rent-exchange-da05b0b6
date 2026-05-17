
CREATE OR REPLACE FUNCTION public.initiate_return(_rental_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_renter uuid;
  v_status text;
  v_confirmed timestamptz;
BEGIN
  SELECT renter_id, status, handover_confirmed_at
    INTO v_renter, v_status, v_confirmed
  FROM public.rentals
  WHERE id = _rental_id;

  IF v_renter IS NULL THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_renter THEN
    RAISE EXCEPTION 'Only the renter can initiate the return';
  END IF;

  IF v_confirmed IS NULL THEN
    RAISE EXCEPTION 'Handover not yet confirmed';
  END IF;

  IF v_status NOT IN ('active') THEN
    RAISE EXCEPTION 'Rental is not active';
  END IF;

  INSERT INTO public.rental_pv_documents (rental_id, phase)
  VALUES (_rental_id, 'return')
  ON CONFLICT (rental_id, phase) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initiate_return(uuid) TO authenticated;
