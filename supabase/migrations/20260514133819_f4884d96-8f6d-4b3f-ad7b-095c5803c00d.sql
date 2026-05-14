
-- 1. wallet_credit_applied column
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS wallet_credit_applied NUMERIC NOT NULL DEFAULT 0;

-- 2. wallet_ledger table
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL, -- signed: + credit, - debit
  kind TEXT NOT NULL CHECK (kind IN ('rental_credit_hold','rental_credit_capture','rental_credit_release','refund','adjustment')),
  rental_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_rental ON public.wallet_ledger(rental_id);

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage wallet ledger" ON public.wallet_ledger
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. get_user_wallet_balance RPC
CREATE OR REPLACE FUNCTION public.get_user_wallet_balance(_user_id UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  total_withdrawn NUMERIC,
  pending_withdrawals NUMERIC,
  wallet_spent NUMERIC,
  available NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND payment_status IN ('authorized','paid','captured');

  SELECT COALESCE(SUM(amount), 0) INTO _withdrawn
  FROM withdrawal_requests
  WHERE user_id = _user_id AND status IN ('completed','approved');

  SELECT COALESCE(SUM(amount), 0) INTO _pending
  FROM withdrawal_requests
  WHERE user_id = _user_id AND status = 'pending';

  -- wallet_net is sum of signed ledger amounts (negative = spent, positive = refund)
  SELECT COALESCE(SUM(amount), 0) INTO _wallet_net
  FROM wallet_ledger
  WHERE user_id = _user_id;

  RETURN QUERY SELECT
    _earnings,
    _withdrawn,
    _pending,
    -1 * LEAST(_wallet_net, 0), -- wallet_spent positive number
    GREATEST(0, _earnings - _withdrawn - _pending + _wallet_net);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_wallet_balance(UUID) TO authenticated;

-- 4. pay_rental_with_wallet RPC
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

-- 5. Trigger: refund wallet credit when wallet-paid rental is cancelled
CREATE OR REPLACE FUNCTION public.release_wallet_credit_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND COALESCE(OLD.wallet_credit_applied,0) > 0 THEN
    -- only refund if not already released
    IF NOT EXISTS (
      SELECT 1 FROM wallet_ledger
      WHERE rental_id = NEW.id AND kind = 'rental_credit_release'
    ) THEN
      INSERT INTO wallet_ledger(user_id, amount, kind, rental_id, metadata)
      VALUES (NEW.renter_id, OLD.wallet_credit_applied, 'rental_credit_release', NEW.id,
        jsonb_build_object('reason','rental_cancelled'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_wallet_on_cancel ON public.rentals;
CREATE TRIGGER trg_release_wallet_on_cancel
AFTER UPDATE OF status ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.release_wallet_credit_on_cancel();
