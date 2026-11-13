DROP FUNCTION IF EXISTS public.get_user_wallet_balance(uuid);

CREATE OR REPLACE FUNCTION public.get_user_wallet_balance(_user_id uuid)
RETURNS TABLE(total_earnings numeric, pending_earnings numeric, total_withdrawn numeric, pending_withdrawals numeric, wallet_spent numeric, available numeric, bonus_remaining numeric, withdrawable numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _earnings NUMERIC := 0; _pending_earn NUMERIC := 0; _withdrawn NUMERIC := 0;
  _pending NUMERIC := 0; _wallet_net NUMERIC := 0; _bonus NUMERIC := 0; _spent NUMERIC := 0;
  _available NUMERIC := 0; _bonus_left NUMERIC := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT COALESCE(SUM(owner_payout),0) INTO _earnings FROM rentals
   WHERE owner_id=_user_id AND status='completed' AND payment_status IN ('authorized','paid','captured') AND is_test_payment=false;
  SELECT COALESCE(SUM(owner_payout),0) INTO _pending_earn FROM rentals
   WHERE owner_id=_user_id AND handover_confirmed_at IS NOT NULL AND status NOT IN ('completed','cancelled','refunded','disputed')
     AND payment_status IN ('authorized','paid','captured') AND is_test_payment=false;
  SELECT COALESCE(SUM(amount),0) INTO _withdrawn FROM withdrawal_requests WHERE user_id=_user_id AND status IN ('completed','approved');
  SELECT COALESCE(SUM(amount),0) INTO _pending FROM withdrawal_requests WHERE user_id=_user_id AND status='pending';
  SELECT COALESCE(SUM(amount),0) INTO _wallet_net FROM wallet_ledger WHERE user_id=_user_id;
  SELECT COALESCE(SUM(amount),0) INTO _bonus FROM wallet_ledger WHERE user_id=_user_id AND kind='bonus_credit';
  SELECT COALESCE(-SUM(amount),0) INTO _spent FROM wallet_ledger WHERE user_id=_user_id AND kind IN ('rental_credit_capture','rental_credit_release');
  _available := GREATEST(0, _earnings - _withdrawn - _pending + _wallet_net);
  -- Bonus credit is consumed first by wallet payments
  _bonus_left := LEAST(_available, GREATEST(0, _bonus - GREATEST(_spent,0)));
  RETURN QUERY SELECT _earnings, _pending_earn, _withdrawn, _pending,
    -1 * LEAST(_wallet_net - _bonus, 0), _available, _bonus_left, GREATEST(0, _available - _bonus_left);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_user_wallet_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wallet_balance(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_withdrawable_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _w NUMERIC;
BEGIN
  SELECT withdrawable INTO _w FROM get_user_wallet_balance(NEW.user_id);
  IF NEW.amount > COALESCE(_w,0) THEN
    RAISE EXCEPTION 'amount_exceeds_withdrawable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_withdrawable_limit ON public.withdrawal_requests;
CREATE TRIGGER trg_enforce_withdrawable_limit BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_withdrawable_limit();