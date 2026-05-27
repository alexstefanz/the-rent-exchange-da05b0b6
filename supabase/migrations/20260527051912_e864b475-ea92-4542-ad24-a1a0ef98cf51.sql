
-- 1) Hide precise pickup address/coords from unauthenticated public scrapers.
--    Authenticated users keep access (needed for product detail map/booking flow).
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng) ON public.products FROM anon;

-- 2) Stop exposing account deactivation tokens to the client. These are
--    only consumed server-side by edge functions (service role keeps access).
REVOKE SELECT (deactivation_token, deactivation_token_expires_at) ON public.profiles FROM anon, authenticated;

-- 3) Prevent renters from mutating financial / state columns on their own
--    rental via the "Renters can cancel own pending rentals" UPDATE policy.
--    The RLS WITH CHECK already forces status='cancelled', but does NOT
--    restrict which OTHER columns are written. Enforce column lock via trigger.
CREATE OR REPLACE FUNCTION public.lock_renter_rental_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip checks for service role, admins, or when the caller is the owner.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.owner_id THEN
    RETURN NEW;
  END IF;

  -- From here on, the caller is the renter (or some unauthorized actor).
  IF auth.uid() <> OLD.renter_id THEN
    RAISE EXCEPTION 'Not allowed to update this rental';
  END IF;

  -- Renter is only ever allowed to flip status to 'cancelled' (+ optional
  -- cancellation_reason / renter_seen_confirmation). Reject any other
  -- column delta so payment_intent_id, refund_amount, wallet_credit_applied,
  -- prices, dates, etc. cannot be tampered with.
  IF NEW.product_id              IS DISTINCT FROM OLD.product_id              OR
     NEW.renter_id               IS DISTINCT FROM OLD.renter_id               OR
     NEW.owner_id                IS DISTINCT FROM OLD.owner_id                OR
     NEW.start_date              IS DISTINCT FROM OLD.start_date              OR
     NEW.end_date                IS DISTINCT FROM OLD.end_date                OR
     NEW.rental_days             IS DISTINCT FROM OLD.rental_days             OR
     NEW.daily_price             IS DISTINCT FROM OLD.daily_price             OR
     NEW.platform_fee_percent    IS DISTINCT FROM OLD.platform_fee_percent    OR
     NEW.subtotal                IS DISTINCT FROM OLD.subtotal                OR
     NEW.platform_fee            IS DISTINCT FROM OLD.platform_fee            OR
     NEW.owner_payout            IS DISTINCT FROM OLD.owner_payout            OR
     NEW.payment_status          IS DISTINCT FROM OLD.payment_status          OR
     NEW.payment_method          IS DISTINCT FROM OLD.payment_method          OR
     NEW.paid_at                 IS DISTINCT FROM OLD.paid_at                 OR
     NEW.confirmed_at            IS DISTINCT FROM OLD.confirmed_at            OR
     NEW.completed_at            IS DISTINCT FROM OLD.completed_at            OR
     NEW.payment_intent_id       IS DISTINCT FROM OLD.payment_intent_id       OR
     NEW.authorized_at           IS DISTINCT FROM OLD.authorized_at           OR
     NEW.captured_at             IS DISTINCT FROM OLD.captured_at             OR
     NEW.handover_confirmed_at   IS DISTINCT FROM OLD.handover_confirmed_at   OR
     NEW.return_confirmed_at     IS DISTINCT FROM OLD.return_confirmed_at     OR
     NEW.refunded_at             IS DISTINCT FROM OLD.refunded_at             OR
     NEW.public_id               IS DISTINCT FROM OLD.public_id               OR
     NEW.refund_amount           IS DISTINCT FROM OLD.refund_amount           OR
     NEW.owner_compensation      IS DISTINCT FROM OLD.owner_compensation      OR
     NEW.wallet_credit_applied   IS DISTINCT FROM OLD.wallet_credit_applied   OR
     NEW.platform_fee            IS DISTINCT FROM OLD.platform_fee            OR
     NEW.cancellation_tier       IS DISTINCT FROM OLD.cancellation_tier       OR
     NEW.is_test_payment         IS DISTINCT FROM OLD.is_test_payment         THEN
    RAISE EXCEPTION 'Renters can only cancel their pending rentals; financial / state columns are read-only';
  END IF;

  -- Enforce the legal transition (status: pending -> cancelled).
  IF OLD.status <> 'pending' OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Renters can only transition a pending rental to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_renter_rental_update ON public.rentals;
CREATE TRIGGER trg_lock_renter_rental_update
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.lock_renter_rental_update();
