ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS identity_session_id text,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_last_error text;

CREATE OR REPLACE FUNCTION public.enforce_profile_protected_columns()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.is_banned      := OLD.is_banned;
  NEW.banned_at      := OLD.banned_at;
  NEW.banned_by      := OLD.banned_by;
  NEW.ban_reason     := OLD.ban_reason;
  NEW.phone_verified := OLD.phone_verified;
  NEW.is_deactivated := OLD.is_deactivated;
  NEW.id             := OLD.id;
  NEW.identity_status      := OLD.identity_status;
  NEW.identity_session_id  := OLD.identity_session_id;
  NEW.identity_verified_at := OLD.identity_verified_at;
  NEW.identity_last_error  := OLD.identity_last_error;
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