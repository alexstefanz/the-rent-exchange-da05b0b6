CREATE OR REPLACE FUNCTION public.pay_rental_with_wallet(_rental_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _rental RECORD;
  _bal RECORD;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT * INTO _rental FROM rentals WHERE id = _rental_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rental_not_found'; END IF;
  IF _rental.renter_id <> _user THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _rental.status NOT IN ('confirmed') THEN RAISE EXCEPTION 'invalid_status: %', _rental.status; END IF;
  IF _rental.payment_status IN ('authorized','paid','captured') THEN
    RAISE EXCEPTION 'already_paid';
  END IF;
  IF COALESCE(_rental.wallet_credit_applied,0) > 0 THEN
    RAISE EXCEPTION 'wallet_already_applied';
  END IF;

  SELECT * INTO _bal FROM get_user_wallet_balance(_user);
  IF _bal.available < _rental.subtotal THEN
    RAISE EXCEPTION 'insufficient_wallet_balance';
  END IF;

  -- Debit renter wallet
  INSERT INTO wallet_ledger(user_id, amount, kind, rental_id, metadata)
  VALUES (_user, -_rental.subtotal, 'rental_credit_capture', _rental_id,
    jsonb_build_object('subtotal', _rental.subtotal, 'platform_fee', _rental.platform_fee, 'owner_payout', _rental.owner_payout));

  -- Trusted transition: bypass renter anti-tampering trigger for this UPDATE only.
  PERFORM set_config('app.bypass_renter_lock', 'on', true);

  -- Mark rental as paid (wallet)
  UPDATE rentals SET
    wallet_credit_applied = _rental.subtotal,
    payment_method = 'wallet',
    payment_status = 'paid',
    paid_at = COALESCE(paid_at, now()),
    updated_at = now()
  WHERE id = _rental_id;

  RETURN jsonb_build_object(
    'ok', true,
    'amount_charged', _rental.subtotal,
    'wallet_remaining', _bal.available - _rental.subtotal
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pay_rental_with_wallet(UUID) TO authenticated;