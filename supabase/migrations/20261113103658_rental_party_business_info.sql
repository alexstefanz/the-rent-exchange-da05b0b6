CREATE OR REPLACE FUNCTION public.get_rental_parties_business(_rental_id uuid)
RETURNS TABLE(party text, account_type text, company_name text, cui text, reg_com text, company_address text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (public.has_role(_uid,'admin'::app_role) OR public.has_role(_uid,'insurer'::app_role) OR EXISTS (
    SELECT 1 FROM public.rentals r WHERE r.id = _rental_id AND (r.renter_id = _uid OR r.owner_id = _uid))) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT 'owner'::text, p.account_type, p.company_name, p.cui, p.reg_com, p.company_address
    FROM public.rentals r JOIN public.profiles p ON p.id = r.owner_id WHERE r.id = _rental_id
  UNION ALL
  SELECT 'renter'::text, p.account_type, p.company_name, p.cui, p.reg_com, p.company_address
    FROM public.rentals r JOIN public.profiles p ON p.id = r.renter_id WHERE r.id = _rental_id;
END $$;
REVOKE ALL ON FUNCTION public.get_rental_parties_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_parties_business(uuid) TO authenticated;
