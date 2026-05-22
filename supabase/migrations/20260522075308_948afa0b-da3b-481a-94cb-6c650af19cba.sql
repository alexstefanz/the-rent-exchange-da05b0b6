
CREATE TABLE public.kyc_extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  kyc_case_id uuid REFERENCES public.kyc_cases(id) ON DELETE SET NULL,
  cnp text,
  id_series text,
  id_number text,
  full_name text,
  address text,
  birth_date date,
  issued_by text,
  valid_until date,
  extraction_model text,
  extraction_confidence numeric,
  extraction_raw jsonb,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  verified_by_admin boolean NOT NULL DEFAULT false,
  verified_by_admin_id uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_extracted_data_kyc_case ON public.kyc_extracted_data(kyc_case_id);
CREATE INDEX idx_kyc_extracted_data_user ON public.kyc_extracted_data(user_id);

ALTER TABLE public.kyc_extracted_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on kyc_extracted_data"
  ON public.kyc_extracted_data
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own extracted data"
  ON public.kyc_extracted_data
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.kyc_extracted_data_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kyc_extracted_data_updated_at
  BEFORE UPDATE ON public.kyc_extracted_data
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_extracted_data_touch_updated_at();

CREATE OR REPLACE FUNCTION public.get_pv_identity_data(_rental_id uuid)
RETURNS TABLE (
  party text,
  user_id uuid,
  cnp text,
  id_series text,
  id_number text,
  full_name text,
  address text,
  birth_date date,
  verified_by_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _renter uuid;
  _allowed boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT r.owner_id, r.renter_id INTO _owner, _renter
  FROM public.rentals r WHERE r.id = _rental_id;
  IF _owner IS NULL THEN RETURN; END IF;

  _allowed := public.has_role(_uid, 'admin'::app_role) OR _uid = _owner OR _uid = _renter;
  IF NOT _allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  SELECT 'owner'::text, _owner,
         k.cnp, k.id_series, k.id_number, k.full_name, k.address, k.birth_date,
         COALESCE(k.verified_by_admin, false)
  FROM (SELECT _owner AS uid) o
  LEFT JOIN public.kyc_extracted_data k ON k.user_id = o.uid
  UNION ALL
  SELECT 'renter'::text, _renter,
         k.cnp, k.id_series, k.id_number, k.full_name, k.address, k.birth_date,
         COALESCE(k.verified_by_admin, false)
  FROM (SELECT _renter AS uid) r
  LEFT JOIN public.kyc_extracted_data k ON k.user_id = r.uid;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_pv_identity_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pv_identity_data(uuid) TO authenticated;
