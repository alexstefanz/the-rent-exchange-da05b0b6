CREATE OR REPLACE FUNCTION public.get_identity_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT identity_status = 'verified' FROM public.profiles WHERE id = _user_id), false) $$;
GRANT EXECUTE ON FUNCTION public.get_identity_verified(uuid) TO anon, authenticated;