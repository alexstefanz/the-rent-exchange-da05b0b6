-- 1) phone_otp_verifications: explicit deny for client roles (defence in depth)
DROP POLICY IF EXISTS "phone_otp_no_client_access" ON public.phone_otp_verifications;
CREATE POLICY "phone_otp_no_client_access"
ON public.phone_otp_verifications
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

REVOKE ALL ON public.phone_otp_verifications FROM anon, authenticated;
GRANT ALL ON public.phone_otp_verifications TO service_role;

-- 2) rentals: lock financial / sensitive columns against owner client-side updates
CREATE OR REPLACE FUNCTION public.enforce_rental_owner_update_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  -- Service role and other non-authenticated paths (edge functions) skip this check
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins are exempt
  is_admin := public.has_role(uid, 'admin'::app_role);
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Only apply restrictions when an owner (not renter) is updating their own rental
  IF uid = OLD.owner_id AND uid <> COALESCE(OLD.renter_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    -- Block changes to financial/sensitive columns
    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
       OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
       OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
       OR NEW.daily_price IS DISTINCT FROM OLD.daily_price
       OR NEW.rental_days IS DISTINCT FROM OLD.rental_days
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
       OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
       OR NEW.owner_payout_released_at IS DISTINCT FROM OLD.owner_payout_released_at
       OR NEW.early_return_new_subtotal IS DISTINCT FROM OLD.early_return_new_subtotal
       OR NEW.early_return_refund_amount IS DISTINCT FROM OLD.early_return_refund_amount
    THEN
      RAISE EXCEPTION 'Owners cannot modify financial or scheduling fields directly. Use the dedicated server function.'
        USING ERRCODE = '42501';
    END IF;

    -- Restrict status transitions: owners can only set status to 'cancelled' from the client
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status <> 'cancelled' THEN
        RAISE EXCEPTION 'Owners can only set rental status to cancelled from the client (got: %)', NEW.status
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_rental_owner_update_restrictions ON public.rentals;
CREATE TRIGGER trg_enforce_rental_owner_update_restrictions
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_rental_owner_update_restrictions();