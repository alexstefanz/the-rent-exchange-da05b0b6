CREATE OR REPLACE FUNCTION public.admin_reset_identity_verification(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  UPDATE public.profiles SET
    identity_status = 'unverified',
    identity_session_id = NULL,
    identity_verified_at = NULL,
    identity_last_error = NULL
  WHERE id = _user_id;
  INSERT INTO public.user_activity_logs(user_id, action, entity_type, entity_id, metadata)
  VALUES (_user_id, 'admin_identity_reset', 'profile', _user_id::text, jsonb_build_object('admin_id', auth.uid()));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_identity_verification(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_identity_verification(uuid) TO authenticated;