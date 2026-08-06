CREATE OR REPLACE FUNCTION public.enforce_rental_owner_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Trusted backend paths
  IF auth.role() = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user = 'service_role'
     OR current_setting('app.bypass_renter_lock', true) = 'on'
     OR public.has_role(uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Owner (and not simultaneously renter): column allowlist
  IF uid = OLD.owner_id AND uid <> COALESCE(OLD.renter_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    -- Financial / payment state is never writable by owners
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.authorized_at IS DISTINCT FROM OLD.authorized_at
       OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
       OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
       OR NEW.payment_intent_id IS DISTINCT FROM OLD.payment_intent_id
       OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.platform_fee_percent IS DISTINCT FROM OLD.platform_fee_percent
       OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
       OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
       OR NEW.owner_compensation IS DISTINCT FROM OLD.owner_compensation
       OR NEW.wallet_credit_applied IS DISTINCT FROM OLD.wallet_credit_applied
       OR NEW.daily_price IS DISTINCT FROM OLD.daily_price
       OR NEW.rental_days IS DISTINCT FROM OLD.rental_days
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.public_id IS DISTINCT FROM OLD.public_id
       OR NEW.is_test_payment IS DISTINCT FROM OLD.is_test_payment
       OR NEW.early_return_new_subtotal IS DISTINCT FROM OLD.early_return_new_subtotal
       OR NEW.early_return_refund_amount IS DISTINCT FROM OLD.early_return_refund_amount
       OR NEW.dispute_status IS DISTINCT FROM OLD.dispute_status
       OR NEW.dispute_opened_at IS DISTINCT FROM OLD.dispute_opened_at
       OR NEW.dispute_phase IS DISTINCT FROM OLD.dispute_phase
       OR NEW.dispute_opened_by IS DISTINCT FROM OLD.dispute_opened_by
       OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
       OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
       OR NEW.handover_confirmed_at IS DISTINCT FROM OLD.handover_confirmed_at
       OR NEW.return_confirmed_at IS DISTINCT FROM OLD.return_confirmed_at
    THEN
      RAISE EXCEPTION 'Owners cannot modify payment, financial, dispute or lifecycle fields directly. Use the dedicated server function.'
        USING ERRCODE = '42501';
    END IF;

    -- Status: only cancelling / rejecting a request that is not yet running
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (NEW.status IN ('cancelled', 'rejected') AND OLD.status IN ('pending', 'accepted', 'confirmed')) THEN
      RAISE EXCEPTION 'Owners cannot change rental status directly.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Owners can update own rental requests" ON public.rentals;
CREATE POLICY "Owners can update own rental requests"
ON public.rentals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  AND dispute_status = 'none'::text
  AND status = ANY (ARRAY['pending','confirmed','accepted','active','cancelled','rejected'])
);