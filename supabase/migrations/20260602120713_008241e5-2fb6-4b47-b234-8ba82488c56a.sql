CREATE OR REPLACE FUNCTION public.get_product_deletion_status(_slug text)
RETURNS TABLE(exists_flag boolean, deleted boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS exists_flag,
    (deleted_at IS NOT NULL) AS deleted
  FROM public.products
  WHERE slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_deletion_status(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_product_deletion_status_by_id(_id uuid)
RETURNS TABLE(exists_flag boolean, deleted boolean, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS exists_flag,
    (deleted_at IS NOT NULL) AS deleted,
    slug
  FROM public.products
  WHERE id = _id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_deletion_status_by_id(uuid) TO anon, authenticated;