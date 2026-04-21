CREATE OR REPLACE FUNCTION public.enforce_kyc_for_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_status text;
BEGIN
  -- Admins bypass KYC check
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Determine which user to check based on table
  IF TG_TABLE_NAME = 'products' THEN
    v_user_id := NEW.owner_id;
  ELSIF TG_TABLE_NAME = 'rentals' THEN
    v_user_id := NEW.renter_id;
  ELSE
    RETURN NEW;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT kyc_status INTO v_status
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_status IS DISTINCT FROM 'VERIFIED' THEN
    RAISE EXCEPTION 'KYC_REQUIRED: Identity verification required before this action.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_kyc_check ON public.products;
CREATE TRIGGER products_kyc_check
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_for_actions();

DROP TRIGGER IF EXISTS rentals_kyc_check ON public.rentals;
CREATE TRIGGER rentals_kyc_check
  BEFORE INSERT ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_for_actions();