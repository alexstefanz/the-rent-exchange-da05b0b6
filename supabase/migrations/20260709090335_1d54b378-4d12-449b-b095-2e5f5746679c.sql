
-- 1. Lock down conversations: authenticated participants can only update safe columns.
REVOKE UPDATE ON public.conversations FROM authenticated;
GRANT UPDATE (buyer_last_read_at, owner_last_read_at, reopened_at, updated_at)
  ON public.conversations TO authenticated;

-- 2. Extend the rentals trigger to also guard `status`, allowing owners to only cancel.
CREATE OR REPLACE FUNCTION public.enforce_rentals_participant_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Trusted backend calls (edge functions using the service role key) are allowed
  -- to update payment/financial fields. Browser users cannot assume this role.
  IF auth.role() = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Trusted SECURITY DEFINER RPCs (e.g. pay_rental_with_wallet) set this
  -- transaction-local flag before performing controlled financial updates.
  IF current_setting('app.bypass_renter_lock', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
     OR NEW.dispute_status IS DISTINCT FROM OLD.dispute_status
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.public_id IS DISTINCT FROM OLD.public_id
     OR NEW.daily_price IS DISTINCT FROM OLD.daily_price THEN
    RAISE EXCEPTION 'Not allowed to modify payment/financial rental fields';
  END IF;

  -- Status transitions must go through controlled flows (edge functions / RPCs).
  -- The only direct client-side transition still allowed is an owner cancelling
  -- a pending/accepted request from their dashboard.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() = OLD.owner_id
       AND NEW.status = 'cancelled'
       AND OLD.status IN ('pending', 'accepted') THEN
      -- allowed owner cancel
      NULL;
    ELSE
      RAISE EXCEPTION 'Not allowed to change rental status directly';
    END IF;
  END IF;

  RETURN NEW;
END
$function$;
