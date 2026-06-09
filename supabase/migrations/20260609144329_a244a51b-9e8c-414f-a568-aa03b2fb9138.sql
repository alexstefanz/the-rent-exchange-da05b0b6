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
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  is_admin := public.has_role(uid, 'admin'::app_role);
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF uid = OLD.owner_id AND uid <> COALESCE(OLD.renter_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
       OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
       OR NEW.daily_price IS DISTINCT FROM OLD.daily_price
       OR NEW.rental_days IS DISTINCT FROM OLD.rental_days
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.payment_intent_id IS DISTINCT FROM OLD.payment_intent_id
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
       OR NEW.early_return_new_subtotal IS DISTINCT FROM OLD.early_return_new_subtotal
       OR NEW.early_return_refund_amount IS DISTINCT FROM OLD.early_return_refund_amount
    THEN
      RAISE EXCEPTION 'Owners cannot modify financial or scheduling fields directly. Use the dedicated server function.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;