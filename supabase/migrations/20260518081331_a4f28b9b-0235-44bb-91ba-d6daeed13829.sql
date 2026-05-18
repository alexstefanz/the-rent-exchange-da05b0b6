CREATE OR REPLACE FUNCTION public.notify_owner_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_title text;
  v_link text;
  v_should_notify boolean := false;
BEGIN
  -- Only fire when payment_status becomes authorized or paid for the first time
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status IN ('authorized','paid') THEN
      v_should_notify := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.payment_status IN ('authorized','paid')
       AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
      v_should_notify := true;
    END IF;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_product_title FROM products WHERE id = NEW.product_id;
  v_link := '/rezervari/' || COALESCE(NEW.public_id, NEW.id::text);

  -- Idempotency: skip if a payment_succeeded notification already exists for this rental owner
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = NEW.owner_id
      AND type = 'payment_succeeded'
      AND link = v_link
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title_ro, title_en, description_ro, description_en, link)
  VALUES (
    NEW.owner_id,
    'payment_succeeded',
    'Plata a fost confirmată',
    'Payment confirmed',
    'Plata pentru "' || COALESCE(v_product_title, 'produs') || '" a fost confirmată',
    'Payment for "' || COALESCE(v_product_title, 'product') || '" was confirmed',
    v_link
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owner_payment_ins ON public.rentals;
DROP TRIGGER IF EXISTS trg_notify_owner_payment_upd ON public.rentals;

CREATE TRIGGER trg_notify_owner_payment_ins
AFTER INSERT ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_owner_payment();

CREATE TRIGGER trg_notify_owner_payment_upd
AFTER UPDATE OF payment_status ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_owner_payment();