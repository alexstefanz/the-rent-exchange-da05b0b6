CREATE OR REPLACE FUNCTION public.get_insurer_rental_detail(_rental_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_insurer_or_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'rental', to_jsonb(r) - 'payment_intent_id',
    'product', jsonb_build_object('title', COALESCE(r.product_title_snapshot,p.title), 'category', p.category,
       'serial_number', p.serial_number, 'condition', p.condition, 'deposit_type', p.deposit_type,
       'deposit_value', p.deposit_value, 'location_city', p.location_city,
       'images', COALESCE(to_jsonb(p.images), CASE WHEN r.product_image_snapshot IS NOT NULL THEN jsonb_build_array(r.product_image_snapshot) ELSE '[]'::jsonb END)),
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
END $function$;