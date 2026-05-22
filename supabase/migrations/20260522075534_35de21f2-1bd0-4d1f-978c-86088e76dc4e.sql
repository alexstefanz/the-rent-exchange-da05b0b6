
DROP FUNCTION IF EXISTS public.get_rental_full_detail(text);

CREATE OR REPLACE FUNCTION public.get_rental_full_detail(_public_id text)
RETURNS TABLE (
  id uuid,
  public_id text,
  status text,
  payment_status text,
  rejection_reason text,
  start_date date,
  end_date date,
  rental_days integer,
  daily_price numeric,
  subtotal numeric,
  platform_fee numeric,
  owner_payout numeric,
  pickup_location text,
  pickup_time timestamptz,
  handover_confirmed_at timestamptz,
  return_confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  dispute_status text,
  early_return_status text,
  is_test_payment boolean,
  created_at timestamptz,
  product_id uuid,
  product_title text,
  product_image text,
  product_category text,
  product_included_items text[],
  product_deposit_value numeric,
  product_location_city text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  owner_phone text,
  renter_id uuid,
  renter_name text,
  renter_email text,
  renter_phone text,
  handover_pv_generated_at timestamptz,
  handover_pv_owner_signed_at timestamptz,
  handover_pv_renter_signed_at timestamptz,
  return_pv_generated_at timestamptz,
  return_pv_owner_signed_at timestamptz,
  return_pv_renter_signed_at timestamptz,
  owner_cnp text,
  owner_id_series text,
  owner_id_number text,
  owner_address text,
  owner_identity_verified boolean,
  renter_cnp text,
  renter_id_series text,
  renter_id_number text,
  renter_address text,
  renter_identity_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rental_id uuid;
  _allowed boolean;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT r.id INTO _rental_id FROM public.rentals r WHERE r.public_id = _public_id;
  IF _rental_id IS NULL THEN RETURN; END IF;
  SELECT (public.has_role(_uid,'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.rentals r WHERE r.id = _rental_id AND (r.renter_id = _uid OR r.owner_id = _uid)
  )) INTO _allowed;
  IF NOT _allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  SELECT
    r.id, r.public_id, r.status, r.payment_status, r.rejection_reason,
    r.start_date, r.end_date, r.rental_days, r.daily_price, r.subtotal, r.platform_fee, r.owner_payout,
    r.pickup_location, r.pickup_time,
    r.handover_confirmed_at, r.return_confirmed_at, r.cancelled_at, r.completed_at,
    r.dispute_status, r.early_return_status, r.is_test_payment, r.created_at,
    p.id, p.title, COALESCE(p.images[1], NULL::text), p.category, p.included_items, p.deposit_value, p.location_city,
    op.id, op.full_name, op.email, op.phone,
    rp.id, rp.full_name, rp.email, rp.phone,
    hpv.generated_at, hpv.owner_signed_at, hpv.renter_signed_at,
    retpv.generated_at, retpv.owner_signed_at, retpv.renter_signed_at,
    ok.cnp, ok.id_series, ok.id_number, ok.address, COALESCE(ok.verified_by_admin, false),
    rk.cnp, rk.id_series, rk.id_number, rk.address, COALESCE(rk.verified_by_admin, false)
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles op ON op.id = r.owner_id
  LEFT JOIN public.profiles rp ON rp.id = r.renter_id
  LEFT JOIN public.rental_pv_documents hpv ON hpv.rental_id = r.id AND hpv.phase = 'handover'
  LEFT JOIN public.rental_pv_documents retpv ON retpv.rental_id = r.id AND retpv.phase = 'return'
  LEFT JOIN public.kyc_extracted_data ok ON ok.user_id = r.owner_id
  LEFT JOIN public.kyc_extracted_data rk ON rk.user_id = r.renter_id
  WHERE r.id = _rental_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_rental_full_detail(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_full_detail(text) TO authenticated;
