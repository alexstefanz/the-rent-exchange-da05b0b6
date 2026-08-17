CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_banned boolean;
BEGIN
  -- Only allow checking your own ban status, or admins/service role checking anyone.
  IF _user_id IS DISTINCT FROM auth.uid()
     AND auth.role() <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to check ban status for this user';
  END IF;

  SELECT COALESCE(p.is_banned, false) INTO v_banned
  FROM public.profiles p
  WHERE p.id = _user_id;

  RETURN COALESCE(v_banned, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO authenticated, service_role;