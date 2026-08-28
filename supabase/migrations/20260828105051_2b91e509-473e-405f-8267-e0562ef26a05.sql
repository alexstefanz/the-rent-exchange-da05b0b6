ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_by uuid;

CREATE INDEX IF NOT EXISTS idx_products_deletion_requested_at
  ON public.products (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;

-- Owner requests deletion: listing is hidden immediately, admin confirms later.
CREATE OR REPLACE FUNCTION public.request_product_deletion(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_active int;
BEGIN
  SELECT owner_id INTO v_owner FROM public.products WHERE id = _id AND deleted_at IS NULL;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'NOT_PRODUCT_OWNER';
  END IF;

  SELECT count(*) INTO v_active
  FROM public.rentals
  WHERE product_id = _id
    AND status IN ('pending','confirmed','active','early_return_requested');
  IF v_active > 0 THEN
    RAISE EXCEPTION 'PRODUCT_HAS_ACTIVE_RENTALS';
  END IF;

  UPDATE public.products
     SET deletion_requested_at = now(),
         deletion_requested_by = auth.uid(),
         is_active = false
   WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_product_deletion(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.request_product_deletion(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_product_deletion_request(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.products WHERE id = _id AND deleted_at IS NULL;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'NOT_PRODUCT_OWNER';
  END IF;

  UPDATE public.products
     SET deletion_requested_at = NULL,
         deletion_requested_by = NULL
   WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_product_deletion_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_product_deletion_request(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_confirm_product_deletion(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE public.products
     SET deleted_at = now(),
         deleted_by = auth.uid(),
         is_active = false,
         deletion_requested_at = NULL,
         deletion_requested_by = NULL
   WHERE id = _id AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_confirm_product_deletion(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_confirm_product_deletion(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_reject_product_deletion(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE public.products
     SET deletion_requested_at = NULL,
         deletion_requested_by = NULL,
         is_active = true
   WHERE id = _id AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_product_deletion(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reject_product_deletion(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_admin_pending_deletions()
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  daily_price_owner numeric,
  location_city text,
  images text[],
  slug text,
  owner_id uuid,
  owner_name text,
  approval_status text,
  created_at timestamptz,
  deletion_requested_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.title, p.category, p.daily_price_owner, p.location_city, p.images,
         p.slug, p.owner_id, COALESCE(pr.full_name, 'Utilizator') AS owner_name,
         p.approval_status, p.created_at, p.deletion_requested_at
  FROM public.products p
  LEFT JOIN public.profiles pr ON pr.id = p.owner_id
  WHERE p.deleted_at IS NULL
    AND p.deletion_requested_at IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
  ORDER BY p.deletion_requested_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_admin_pending_deletions() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_pending_deletions() TO authenticated, service_role;