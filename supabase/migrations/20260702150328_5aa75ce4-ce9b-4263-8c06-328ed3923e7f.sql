CREATE OR REPLACE FUNCTION public.tg_rentals_enforce_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product     record;
  v_days        integer;
  v_subtotal    numeric(12, 2);
  v_fee_percent numeric(6, 2);
  v_fee         numeric(12, 2);
  v_min_fee     numeric(12, 2) := 1;
  v_is_admin    boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_days := COALESCE(NEW.rental_days, GREATEST(1, (NEW.end_date - NEW.start_date)));
    IF v_days IS NULL OR v_days <= 0 THEN
      RAISE EXCEPTION 'INVALID_RENTAL_DAYS';
    END IF;

    SELECT id, daily_price_owner, platform_fee_percent
      INTO v_product
    FROM public.products
    WHERE id = NEW.product_id;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;

    v_fee_percent := COALESCE(v_product.platform_fee_percent, 5);
    v_subtotal := ROUND((v_days * v_product.daily_price_owner)::numeric, 2);

    IF v_fee_percent > 0 AND v_subtotal > 0 THEN
      v_fee := GREATEST(v_min_fee, ROUND((v_subtotal * v_fee_percent / 100)::numeric, 2));
    ELSE
      v_fee := 0;
    END IF;

    NEW.rental_days          := v_days;
    NEW.daily_price          := v_product.daily_price_owner;
    NEW.subtotal             := v_subtotal;
    NEW.platform_fee         := v_fee;
    NEW.platform_fee_percent := v_fee_percent;
    NEW.owner_payout         := v_subtotal;
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    NEW.daily_price          := OLD.daily_price;
    NEW.subtotal             := OLD.subtotal;
    NEW.platform_fee         := OLD.platform_fee;
    NEW.platform_fee_percent := OLD.platform_fee_percent;
    NEW.owner_payout         := OLD.owner_payout;
    NEW.rental_days          := OLD.rental_days;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rentals_enforce_price ON public.rentals;
CREATE TRIGGER rentals_enforce_price
BEFORE INSERT OR UPDATE OF daily_price, subtotal, platform_fee, platform_fee_percent, owner_payout, rental_days
ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.tg_rentals_enforce_price();

COMMENT ON FUNCTION public.tg_rentals_enforce_price IS
  'Server-side authoritative rental pricing: recomputes subtotal/platform_fee/owner_payout from products.daily_price_owner on INSERT and blocks non-admin financial mutations on UPDATE.';
