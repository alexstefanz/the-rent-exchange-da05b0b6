CREATE OR REPLACE FUNCTION public.block_profile_identity_column_changes()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') <> 'authenticated'
     OR public.has_role(auth.uid(), 'admin'::app_role)
     OR current_setting('rentli.allow_name_confirm', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.identity_status        IS DISTINCT FROM OLD.identity_status
  OR NEW.identity_session_id    IS DISTINCT FROM OLD.identity_session_id
  OR NEW.identity_verified_at   IS DISTINCT FROM OLD.identity_verified_at
  OR NEW.identity_last_error    IS DISTINCT FROM OLD.identity_last_error
  OR NEW.full_name_locked       IS DISTINCT FROM OLD.full_name_locked
  OR NEW.full_name_verified_at  IS DISTINCT FROM OLD.full_name_verified_at THEN
    RAISE EXCEPTION 'PROTECTED_PROFILE_COLUMNS: Aceste câmpuri pot fi modificate doar de sistem sau de administrator.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_block_profile_identity_column_changes ON public.profiles;
CREATE TRIGGER trg_block_profile_identity_column_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.block_profile_identity_column_changes();

CREATE OR REPLACE FUNCTION public.confirm_my_full_name(_full_name text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v text := regexp_replace(btrim(coalesce(_full_name,'')), '\s+', ' ', 'g');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF length(v) < 2 OR position(' ' in v) = 0 OR length(v) > 120 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  PERFORM set_config('rentli.allow_name_confirm', 'on', true);
  UPDATE public.profiles
     SET full_name = CASE WHEN full_name_locked THEN full_name ELSE v END,
         full_name_verified_at = coalesce(full_name_verified_at, now()),
         full_name_locked = true
   WHERE id = auth.uid();
  PERFORM set_config('rentli.allow_name_confirm', 'off', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.confirm_my_full_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_my_full_name(text) TO authenticated;