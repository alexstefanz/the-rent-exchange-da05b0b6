
-- 1) Hide products.serial_number from anon and authenticated roles.
REVOKE SELECT (serial_number) ON public.products FROM anon, authenticated;

-- Secure accessor for owner/admin only
CREATE OR REPLACE FUNCTION public.get_my_product_serial(_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.serial_number
  FROM public.products p
  WHERE p.id = _id
    AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_product_serial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_product_serial(uuid) TO authenticated;

-- 2) Let users read their own role row
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3) Tighten kb_article_views INSERT to not allow spoofing user_id
DROP POLICY IF EXISTS "Anyone log views" ON public.kb_article_views;
CREATE POLICY "Anyone log views"
ON public.kb_article_views
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
