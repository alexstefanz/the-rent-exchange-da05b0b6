CREATE OR REPLACE FUNCTION public.get_product_owner_public_info(owner_uuid uuid)
RETURNS TABLE (id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = owner_uuid
    AND COALESCE(p.is_deactivated, false) = false;
$$;