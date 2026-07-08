
CREATE OR REPLACE FUNCTION public.soft_delete_my_product(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_deleted timestamptz;
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

  IF v_owner <> v_uid AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not the owner' USING ERRCODE = '42501';
  END IF;

  IF v_deleted IS NOT NULL THEN
    RETURN; -- already deleted, idempotent
  END IF;

  UPDATE public.products
  SET deleted_at = now(),
      deleted_by = v_uid,
      is_active = false
  WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_my_product(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_my_product(uuid) TO authenticated;
