CREATE OR REPLACE FUNCTION public.soft_delete_my_product(_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_deleted timestamptz;
  v_active_count int;
  v_is_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT owner_id, deleted_at INTO v_owner, v_deleted
  FROM public.products
  WHERE id = _id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002';
  END IF;

  v_is_admin := public.has_role(v_uid, 'admin'::app_role);

  IF v_owner <> v_uid AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not the owner' USING ERRCODE = '42501';
  END IF;

  IF v_deleted IS NOT NULL THEN
    RETURN;
  END IF;

  -- Block deletion when active rentals exist (owners only; admins can still delete).
  IF NOT v_is_admin THEN
    SELECT count(*) INTO v_active_count
    FROM public.rentals
    WHERE product_id = _id
      AND status IN ('pending','confirmed','active','early_return_requested');

    IF v_active_count > 0 THEN
      RAISE EXCEPTION 'PRODUCT_HAS_ACTIVE_RENTALS' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.products
  SET deleted_at = now(),
      deleted_by = v_uid,
      is_active = false
  WHERE id = _id;
END;
$function$;