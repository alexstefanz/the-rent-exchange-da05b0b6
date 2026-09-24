CREATE OR REPLACE FUNCTION public.enforce_phone_verified_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF; -- service role / system jobs
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  v_uid := CASE WHEN TG_TABLE_NAME = 'products' THEN NEW.owner_id ELSE NEW.renter_id END;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND phone_verified = true) THEN
    RAISE EXCEPTION 'PHONE_NOT_VERIFIED: verify your phone number first' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_phone_verified_on_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_products_phone_verified ON public.products;
CREATE TRIGGER trg_products_phone_verified BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_phone_verified_on_insert();
DROP TRIGGER IF EXISTS trg_rentals_phone_verified ON public.rentals;
CREATE TRIGGER trg_rentals_phone_verified BEFORE INSERT ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_phone_verified_on_insert();