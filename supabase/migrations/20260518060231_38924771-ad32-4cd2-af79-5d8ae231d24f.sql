CREATE OR REPLACE FUNCTION public.renter_cancel_unpaid_rental(_rental_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rental rentals%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  SELECT * INTO v_rental FROM rentals WHERE id = _rental_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RENTAL_NOT_FOUND';
  END IF;

  IF v_rental.renter_id <> v_uid THEN
    RAISE EXCEPTION 'NOT_RENTER';
  END IF;

  IF v_rental.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'INVALID_STATUS: %', v_rental.status;
  END IF;

  IF v_rental.handover_pv_owner_signed_at IS NOT NULL OR v_rental.handover_confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'HANDOVER_ALREADY_SIGNED';
  END IF;

  IF v_rental.payment_status IS NOT NULL
     AND v_rental.payment_status NOT IN ('pending', 'failed', 'canceled', 'cancelled') THEN
    RAISE EXCEPTION 'PAYMENT_ACTIVE: %', v_rental.payment_status;
  END IF;

  UPDATE rentals
  SET status = 'cancelled',
      cancellation_reason = 'renter_self_unpaid',
      cancelled_at = now(),
      cancel_request_status = NULL,
      cancel_request_initiator = NULL,
      cancel_request_subject = NULL,
      cancel_request_reason = NULL,
      updated_at = now()
  WHERE id = _rental_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.renter_cancel_unpaid_rental(uuid) TO authenticated;