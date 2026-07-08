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

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_rental_conversation(p_rental_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role'
    OR current_setting('request.jwt.claim.role', true) = 'service_role';
  v_rental record;
  v_conv_id uuid;
BEGIN
  IF v_caller IS NULL AND NOT v_is_service_role THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id, product_id, renter_id, owner_id
    INTO v_rental
    FROM public.rentals
   WHERE id = p_rental_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rental not found';
  END IF;

  IF NOT v_is_service_role
     AND v_caller <> v_rental.renter_id
     AND v_caller <> v_rental.owner_id THEN
    RAISE EXCEPTION 'not a participant of this rental';
  END IF;

  SELECT id INTO v_conv_id
    FROM public.conversations
   WHERE rentals_id = p_rental_id;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO public.conversations (product_id, buyer_id, owner_id, rentals_id)
  VALUES (v_rental.product_id, v_rental.renter_id, v_rental.owner_id, p_rental_id)
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$function$;