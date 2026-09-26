CREATE OR REPLACE FUNCTION public.enforce_phone_verified_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'products' THEN
    v_uid := NEW.owner_id;
  ELSE
    v_uid := NEW.renter_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND phone_verified = true) THEN
    RAISE EXCEPTION 'PHONE_NOT_VERIFIED: verify your phone number first' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;