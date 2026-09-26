CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_provider text := COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email');
  v_name text := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name'
  );
BEGIN
  INSERT INTO public.profiles (id, full_name, email, full_name_source, full_name_verified_at)
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    CASE WHEN v_provider IN ('google', 'apple') THEN 'oauth' ELSE 'manual' END,
    CASE WHEN v_provider IN ('google', 'apple') THEN NULL ELSE now() END
  );
  RETURN NEW;
END;
$function$;

UPDATE public.profiles
SET full_name_source = COALESCE(full_name_source, 'manual'),
    full_name_verified_at = COALESCE(full_name_verified_at, created_at, now())
WHERE full_name IS NOT NULL AND btrim(full_name) <> '';

CREATE OR REPLACE FUNCTION public.enforce_profile_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.is_banned      := OLD.is_banned;
  NEW.banned_at      := OLD.banned_at;
  NEW.banned_by      := OLD.banned_by;
  NEW.ban_reason     := OLD.ban_reason;
  NEW.kyc_status     := OLD.kyc_status;
  NEW.kyc_level      := OLD.kyc_level;
  NEW.phone_verified := OLD.phone_verified;
  NEW.is_deactivated := OLD.is_deactivated;
  NEW.id             := OLD.id;

  IF OLD.full_name_locked THEN
    NEW.full_name := OLD.full_name;
  END IF;
  NEW.full_name_locked := OLD.full_name_locked OR NEW.full_name_locked;
  IF OLD.full_name_verified_at IS NOT NULL THEN
    NEW.full_name_verified_at := OLD.full_name_verified_at;
  END IF;

  RETURN NEW;
END;
$function$;