CREATE OR REPLACE FUNCTION public.enforce_rentals_participant_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Trusted backend (edge functions using the service role key) is allowed
  -- to update payment/financial fields. This role is never reachable from
  -- the browser — PostgREST only assumes it when called with the service key.
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
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

  RETURN NEW;
END $function$;