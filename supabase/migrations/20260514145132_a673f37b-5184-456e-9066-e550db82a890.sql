CREATE OR REPLACE FUNCTION public.get_user_wallet_balance(_user_id uuid)
 RETURNS TABLE(total_earnings numeric, total_withdrawn numeric, pending_withdrawals numeric, wallet_spent numeric, available numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _earnings NUMERIC := 0;
  _withdrawn NUMERIC := 0;
  _pending NUMERIC := 0;
  _wallet_net NUMERIC := 0;
BEGIN
  IF _user_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(SUM(owner_payout), 0) INTO _earnings
  FROM rentals
  WHERE owner_id = _user_id
    AND payment_status IN ('authorized','paid','captured')
    AND is_test_payment = false;

  SELECT COALESCE(SUM(amount), 0) INTO _withdrawn
  FROM withdrawal_requests
  WHERE user_id = _user_id AND status IN ('completed','approved');

  SELECT COALESCE(SUM(amount), 0) INTO _pending
  FROM withdrawal_requests
  WHERE user_id = _user_id AND status = 'pending';

  SELECT COALESCE(SUM(amount), 0) INTO _wallet_net
  FROM wallet_ledger
  WHERE user_id = _user_id;

  RETURN QUERY SELECT
    _earnings,
    _withdrawn,
    _pending,
    -1 * LEAST(_wallet_net, 0),
    GREATEST(0, _earnings - _withdrawn - _pending + _wallet_net);
END;
$function$;