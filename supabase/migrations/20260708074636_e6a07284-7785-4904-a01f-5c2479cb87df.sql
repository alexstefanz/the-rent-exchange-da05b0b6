
-- =========================================================
-- 1) KYC cases: block self-approval / privilege escalation
-- =========================================================
CREATE OR REPLACE FUNCTION public.prevent_kyc_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may change anything
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot modify decision / risk / level fields
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.level_required IS DISTINCT FROM OLD.level_required
     OR NEW.risk_score IS DISTINCT FROM OLD.risk_score
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.decided_at IS DISTINCT FROM OLD.decided_at
     OR NEW.decided_by_admin_id IS DISTINCT FROM OLD.decided_by_admin_id
     OR NEW.provider_name IS DISTINCT FROM OLD.provider_name
     OR NEW.provider_case_id IS DISTINCT FROM OLD.provider_case_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.user_role IS DISTINCT FROM OLD.user_role THEN
    RAISE EXCEPTION 'Not authorized to modify restricted KYC fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_kyc_self_escalation ON public.kyc_cases;
CREATE TRIGGER trg_prevent_kyc_self_escalation
BEFORE UPDATE ON public.kyc_cases
FOR EACH ROW
EXECUTE FUNCTION public.prevent_kyc_self_escalation();

-- =========================================================
-- 2) Rentals: block owner tampering with financial/payment fields
-- =========================================================
CREATE OR REPLACE FUNCTION public.prevent_rental_owner_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::public.app_role);
BEGIN
  -- Admins & service role (auth.uid() IS NULL from edge functions using service key) bypass
  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Owner-side update: enforce column allowlist
  IF OLD.owner_id = auth.uid() AND NEW.owner_id = OLD.owner_id THEN
    -- Financial / escrow / payment fields are immutable to owners
    IF NEW.daily_price IS DISTINCT FROM OLD.daily_price
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
       OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
       OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
       OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
       OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
       OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.payout_status IS DISTINCT FROM OLD.payout_status
       OR NEW.payout_at IS DISTINCT FROM OLD.payout_at
       OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.public_id IS DISTINCT FROM OLD.public_id THEN
      RAISE EXCEPTION 'Owners cannot modify financial or payment fields on rentals'
        USING ERRCODE = '42501';
    END IF;

    -- Status transitions restricted to legitimate owner actions
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'pending'  AND NEW.status IN ('accepted','rejected','cancelled'))
        OR (OLD.status = 'accepted' AND NEW.status IN ('cancelled'))
      ) THEN
        RAISE EXCEPTION 'Owners cannot perform this status transition (% -> %)', OLD.status, NEW.status
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_rental_owner_tampering ON public.rentals;
CREATE TRIGGER trg_prevent_rental_owner_tampering
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.prevent_rental_owner_tampering();
