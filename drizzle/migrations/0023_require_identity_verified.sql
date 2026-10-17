CREATE OR REPLACE FUNCTION public.enforce_identity_verified_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin') THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND identity_status = 'verified') THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED: Verifică-ți identitatea pentru a continua.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_identity_verified_rentals ON public.rentals;
CREATE TRIGGER trg_identity_verified_rentals BEFORE INSERT ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.enforce_identity_verified_on_insert();

DROP TRIGGER IF EXISTS trg_identity_verified_products ON public.products;
CREATE TRIGGER trg_identity_verified_products BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_identity_verified_on_insert();