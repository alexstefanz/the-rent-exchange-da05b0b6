-- Enable unaccent extension for diacritic-insensitive comparison
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Helper: normalize a full name (lowercase, no diacritics, single spaces)
CREATE OR REPLACE FUNCTION public.normalize_full_name(input_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT CASE
    WHEN input_name IS NULL OR trim(input_name) = '' THEN NULL
    ELSE regexp_replace(unaccent(lower(trim(input_name))), '\s+', ' ', 'g')
  END;
$$;

-- Functional index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_normalized_full_name
  ON public.profiles (public.normalize_full_name(full_name));

-- Allow system-level notification inserts (used by SECURITY DEFINER triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- ============================================
-- Detection function: runs on KYC case submission
-- ============================================
CREATE OR REPLACE FUNCTION public.detect_kyc_duplicate_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_full_name text;
  v_normalized_name text;
  v_duplicate_count int;
  v_duplicate_ids uuid[];
  v_admin record;
BEGIN
  -- Only run when status transitions into SUBMITTED or NEEDS_MANUAL_REVIEW
  IF NEW.status NOT IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get the full name of the user owning this KYC case
  SELECT full_name INTO v_user_full_name
  FROM profiles
  WHERE id = NEW.user_id;

  v_normalized_name := public.normalize_full_name(v_user_full_name);

  IF v_normalized_name IS NULL OR length(v_normalized_name) < 3 THEN
    RETURN NEW;
  END IF;

  -- Find other users with same normalized name
  SELECT array_agg(id), count(*)
    INTO v_duplicate_ids, v_duplicate_count
  FROM profiles
  WHERE id <> NEW.user_id
    AND public.normalize_full_name(full_name) = v_normalized_name;

  IF v_duplicate_count IS NULL OR v_duplicate_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Notify all admins
  FOR v_admin IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title_ro, title_en, description_ro, description_en, link)
    VALUES (
      v_admin.user_id,
      'kyc_duplicate_warning',
      '⚠️ Posibil cont duplicat KYC',
      '⚠️ Possible duplicate KYC account',
      'Utilizatorul ' || COALESCE(v_user_full_name, 'necunoscut') || ' are același nume cu alte ' || v_duplicate_count || ' conturi. Verifică ' || NEW.public_id || '.',
      'User ' || COALESCE(v_user_full_name, 'unknown') || ' shares the same name with ' || v_duplicate_count || ' other accounts. Review ' || NEW.public_id || '.',
      '/admin/kyc/' || NEW.id::text
    );
  END LOOP;

  -- Audit log entry
  INSERT INTO kyc_audit_log (kyc_case_id, action, old_value, new_value, actor_type)
  VALUES (
    NEW.id,
    'DUPLICATE_NAME_DETECTED',
    v_normalized_name,
    array_to_string(v_duplicate_ids, ','),
    'SYSTEM'
  );

  RETURN NEW;
END;
$$;

-- Trigger: AFTER INSERT and AFTER UPDATE on kyc_cases
DROP TRIGGER IF EXISTS on_kyc_case_submitted ON public.kyc_cases;
CREATE TRIGGER on_kyc_case_submitted
AFTER INSERT OR UPDATE OF status ON public.kyc_cases
FOR EACH ROW
EXECUTE FUNCTION public.detect_kyc_duplicate_names();

-- ============================================
-- RPC: list duplicate users for a KYC case (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_kyc_duplicate_users(case_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone,
  kyc_status text,
  products_count bigint,
  rentals_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_normalized_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  SELECT kc.user_id, public.normalize_full_name(p.full_name)
    INTO v_user_id, v_normalized_name
  FROM kyc_cases kc
  LEFT JOIN profiles p ON p.id = kc.user_id
  WHERE kc.id = case_id;

  IF v_normalized_name IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.created_at,
    p.kyc_status,
    (SELECT COUNT(*) FROM products WHERE owner_id = p.id) AS products_count,
    (SELECT COUNT(*) FROM rentals WHERE renter_id = p.id OR owner_id = p.id) AS rentals_count
  FROM profiles p
  WHERE p.id <> v_user_id
    AND public.normalize_full_name(p.full_name) = v_normalized_name
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================
-- Update get_admin_kyc_cases to include duplicate_count
-- ============================================
DROP FUNCTION IF EXISTS public.get_admin_kyc_cases(text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_kyc_cases(
  status_filter text DEFAULT NULL,
  role_filter text DEFAULT NULL,
  level_filter text DEFAULT NULL,
  search_query text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  public_id text,
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  level_required text,
  status text,
  rejection_reason text,
  provider_name text,
  attempts_count integer,
  risk_score integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  submitted_at timestamp with time zone,
  decided_at timestamp with time zone,
  duplicate_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    kc.id,
    kc.public_id,
    kc.user_id,
    COALESCE(p.full_name, 'Utilizator') AS user_name,
    COALESCE(p.email, '') AS user_email,
    kc.user_role,
    kc.level_required,
    kc.status,
    kc.rejection_reason,
    kc.provider_name,
    kc.attempts_count,
    kc.risk_score,
    kc.created_at,
    kc.updated_at,
    kc.submitted_at,
    kc.decided_at,
    COALESCE((
      SELECT COUNT(*)
      FROM profiles p2
      WHERE p2.id <> kc.user_id
        AND public.normalize_full_name(p2.full_name) IS NOT NULL
        AND public.normalize_full_name(p2.full_name) = public.normalize_full_name(p.full_name)
    ), 0) AS duplicate_count
  FROM kyc_cases kc
  LEFT JOIN profiles p ON p.id = kc.user_id
  WHERE
    (status_filter IS NULL OR kc.status = status_filter)
    AND (role_filter IS NULL OR kc.user_role = role_filter)
    AND (level_filter IS NULL OR kc.level_required = level_filter)
    AND (search_query IS NULL OR
      kc.public_id ILIKE '%' || search_query || '%' OR
      p.full_name ILIKE '%' || search_query || '%' OR
      p.email ILIKE '%' || search_query || '%'
    )
  ORDER BY kc.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;