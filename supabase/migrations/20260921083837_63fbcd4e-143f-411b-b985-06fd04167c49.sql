CREATE OR REPLACE FUNCTION public.pay_rental_with_wallet(_rental_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _rental RECORD;
  _bal RECORD;
  _total NUMERIC;
  _product_title TEXT;
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

  -- Renter pays the full amount: subtotal + platform fee (same as Stripe).
  _total := COALESCE(_rental.subtotal,0) + COALESCE(_rental.platform_fee,0);

  SELECT * INTO _bal FROM get_user_wallet_balance(_user);
  IF _bal.available < _total THEN
    RAISE EXCEPTION 'insufficient_wallet_balance';
  END IF;

  INSERT INTO wallet_ledger(user_id, amount, kind, rental_id, metadata)
  VALUES (_user, -_total, 'rental_credit_capture', _rental_id,
    jsonb_build_object('total', _total, 'subtotal', _rental.subtotal,
                       'platform_fee', _rental.platform_fee, 'owner_payout', _rental.owner_payout));

  PERFORM set_config('app.bypass_renter_lock', 'on', true);

  UPDATE rentals SET
    wallet_credit_applied = _total,
    payment_method = 'wallet',
    payment_status = 'paid',
    paid_at = COALESCE(paid_at, now()),
    updated_at = now()
  WHERE id = _rental_id;

  SELECT title INTO _product_title FROM products WHERE id = _rental.product_id;

  -- Settle the ledger of transactions: wallet payments are captured instantly.
  UPDATE transactions
     SET status = 'completed', amount = _total, processed_at = now()
   WHERE rental_id = _rental_id AND type = 'rental_payment';

  IF NOT FOUND THEN
    INSERT INTO transactions(rental_id, user_id, amount, type, status, description, currency, processed_at)
    VALUES (_rental_id, _user, _total, 'rental_payment', 'completed',
            'Plată închiriere (portofel): ' || COALESCE(_product_title, 'Produs'), 'RON', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM transactions WHERE rental_id = _rental_id AND type = 'platform_fee') THEN
    INSERT INTO transactions(rental_id, user_id, amount, type, status, description, currency, processed_at)
    VALUES (_rental_id, _user, COALESCE(_rental.platform_fee,0), 'platform_fee', 'completed',
            'Comision platformă', 'RON', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM transactions WHERE rental_id = _rental_id AND type = 'owner_payout') THEN
    INSERT INTO transactions(rental_id, user_id, amount, type, status, description, currency, processed_at)
    VALUES (_rental_id, _rental.owner_id, COALESCE(_rental.owner_payout,0), 'owner_payout', 'completed',
            'Încasare proprietar', 'RON', now());
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'amount_charged', _total,
    'wallet_remaining', _bal.available - _total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pay_rental_with_wallet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_rental_with_wallet(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_financial_summary(start_date timestamp with time zone DEFAULT NULL, end_date timestamp with time zone DEFAULT NULL)
RETURNS TABLE(total_revenue numeric, platform_fees numeric, owner_payouts numeric, pending_payments numeric, completed_rentals bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(subtotal), 0) as total_revenue,
    COALESCE(SUM(platform_fee), 0) as platform_fees,
    COALESCE(SUM(owner_payout), 0) as owner_payouts,
    COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN subtotal ELSE 0 END), 0) as pending_payments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rentals
  FROM rentals
  WHERE COALESCE(is_test_payment, false) = false
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_financial_summary(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_financial_summary(timestamptz, timestamptz) TO authenticated;