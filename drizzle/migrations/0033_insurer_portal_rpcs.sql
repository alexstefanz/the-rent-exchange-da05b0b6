CREATE OR REPLACE FUNCTION public.is_insurer_or_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('insurer','admin'))
$$;
GRANT EXECUTE ON FUNCTION public.is_insurer_or_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_insurer_rentals(
  _search text DEFAULT NULL, _status text DEFAULT NULL,
  _from date DEFAULT NULL, _to date DEFAULT NULL, _limit int DEFAULT 200)
RETURNS TABLE(id uuid, public_id text, product_title text, start_date date, end_date date,
  rental_days int, status text, payment_status text, subtotal numeric, platform_fee numeric,
  stripe_fee numeric, insurance_fee numeric, deposit_value numeric, dispute_status text,
  owner_name text, renter_name text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_insurer_or_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.id, r.public_id, COALESCE(r.product_title_snapshot, p.title), r.start_date, r.end_date,
    r.rental_days, r.status, r.payment_status, r.subtotal, r.platform_fee, r.stripe_fee,
    r.insurance_fee, p.deposit_value, r.dispute_status, po.full_name, pr.full_name, r.created_at
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles po ON po.id = r.owner_id
  LEFT JOIN profiles pr ON pr.id = r.renter_id
  WHERE (_status IS NULL OR
         (_status = 'dispute' AND r.dispute_status <> 'none') OR
         (_status = 'insured' AND r.insurance_fee > 0) OR
         (_status = 'active' AND r.status NOT IN ('completed','cancelled','rejected','expired','pending')) OR
         r.status = _status)
    AND (_from IS NULL OR r.start_date >= _from)
    AND (_to IS NULL OR r.start_date <= _to)
    AND (_search IS NULL OR _search = '' OR r.public_id ILIKE '%'||_search||'%'
         OR COALESCE(r.product_title_snapshot, p.title) ILIKE '%'||_search||'%'
         OR po.full_name ILIKE '%'||_search||'%' OR pr.full_name ILIKE '%'||_search||'%')
  ORDER BY r.created_at DESC
  LIMIT LEAST(_limit, 2000);
END $$;
GRANT EXECUTE ON FUNCTION public.get_insurer_rentals(text,text,date,date,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_insurer_rental_detail(_rental_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_insurer_or_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'rental', to_jsonb(r) - 'payment_intent_id',
    'product', jsonb_build_object('title', COALESCE(r.product_title_snapshot,p.title), 'category', p.category,
       'serial_number', p.serial_number, 'condition', p.condition, 'deposit_type', p.deposit_type,
       'deposit_value', p.deposit_value, 'location_city', p.location_city),
    'owner', (SELECT jsonb_build_object('full_name',full_name,'email',email,'phone',phone,'account_type',account_type,
       'company_name',company_name,'cui',cui,'identity_status',identity_status) FROM profiles WHERE id=r.owner_id),
    'renter', (SELECT jsonb_build_object('full_name',full_name,'email',email,'phone',phone,'account_type',account_type,
       'company_name',company_name,'cui',cui,'identity_status',identity_status) FROM profiles WHERE id=r.renter_id),
    'inspections', COALESCE((SELECT jsonb_agg(jsonb_build_object('phase',phase,'role',role,'photos',photos,'notes',notes,'created_at',created_at) ORDER BY created_at)
       FROM rental_inspections WHERE rental_id=r.id),'[]'::jsonb),
    'pvs', COALESCE((SELECT jsonb_agg(jsonb_build_object('phase',phase,'pdf_path',pdf_path,'photos',photos,'owner_signed_at',owner_signed_at,'renter_signed_at',renter_signed_at))
       FROM rental_pv_documents WHERE rental_id=r.id),'[]'::jsonb),
    'physical_pvs', COALESCE((SELECT jsonb_agg(jsonb_build_object('phase',phase,'file_path',file_path,'file_name',file_name,'status',status))
       FROM rental_physical_pvs WHERE rental_id=r.id),'[]'::jsonb),
    'contract', COALESCE((SELECT jsonb_agg(jsonb_build_object('role',role,'accepted_at',accepted_at,'validated_at',validated_at))
       FROM rental_contract_acceptances WHERE rental_id=r.id),'[]'::jsonb),
    'history', COALESCE((SELECT jsonb_agg(jsonb_build_object('from',from_status,'to',to_status,'at',created_at,'reason',reason) ORDER BY created_at)
       FROM rental_status_history WHERE rental_id=r.id),'[]'::jsonb)
  ) INTO v
  FROM rentals r LEFT JOIN products p ON p.id=r.product_id WHERE r.id=_rental_id;
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.get_insurer_rental_detail(uuid) TO authenticated;

CREATE POLICY "Insurers can view inspection photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rental-inspections' AND public.is_insurer_or_admin(auth.uid()));
CREATE POLICY "Insurers can view rental pvs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rental-pvs' AND public.is_insurer_or_admin(auth.uid()));