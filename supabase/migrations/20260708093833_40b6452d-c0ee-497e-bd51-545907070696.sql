
CREATE OR REPLACE FUNCTION public.enforce_rentals_participant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
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

CREATE OR REPLACE FUNCTION public.prevent_rental_owner_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::public.app_role);
BEGIN
  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.owner_id = auth.uid() AND NEW.owner_id = OLD.owner_id THEN
    IF NEW.daily_price IS DISTINCT FROM OLD.daily_price
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
       OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
       OR NEW.payment_intent_id IS DISTINCT FROM OLD.payment_intent_id
       OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
       OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.public_id IS DISTINCT FROM OLD.public_id THEN
      RAISE EXCEPTION 'Owners cannot modify financial or payment fields on rentals'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'pending'   AND NEW.status IN ('confirmed','accepted','rejected','cancelled'))
        OR (OLD.status = 'accepted'  AND NEW.status IN ('confirmed','cancelled'))
        OR (OLD.status = 'confirmed' AND NEW.status IN ('active','cancelled'))
        OR (OLD.status = 'active'    AND NEW.status IN ('completed','overdue','cancelled','return_pending'))
        OR (OLD.status = 'overdue'   AND NEW.status IN ('completed','cancelled','return_pending'))
        OR (OLD.status = 'return_pending' AND NEW.status IN ('completed','cancelled'))
      ) THEN
        RAISE EXCEPTION 'Owners cannot perform this status transition (% -> %)', OLD.status, NEW.status
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
