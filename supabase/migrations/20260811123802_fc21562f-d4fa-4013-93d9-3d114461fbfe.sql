DROP POLICY IF EXISTS "Users can view follows pointing at them" ON public.favorite_users;

CREATE OR REPLACE FUNCTION public.enforce_kyc_case_user_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  is_user_submission boolean;
  is_start_progress boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role'
     OR public.has_role(v_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF v_uid <> OLD.user_id THEN
    RETURN NEW;
  END IF;

  is_user_submission :=
    OLD.status IN ('NOT_STARTED','IN_PROGRESS','REJECTED')
    AND NEW.status = 'SUBMITTED'
    AND OLD.submitted_at IS NULL
    AND NEW.submitted_at IS NOT NULL;

  is_start_progress :=
    OLD.status IN ('NOT_STARTED','REJECTED')
    AND NEW.status = 'IN_PROGRESS';

  IF NEW.user_id              IS DISTINCT FROM OLD.user_id              OR
     NEW.risk_score            IS DISTINCT FROM OLD.risk_score            OR
     NEW.level_required        IS DISTINCT FROM OLD.level_required        OR
     NEW.user_role             IS DISTINCT FROM OLD.user_role             OR
     NEW.provider_case_id      IS DISTINCT FROM OLD.provider_case_id      OR
     NEW.provider_name         IS DISTINCT FROM OLD.provider_name         OR
     NEW.attempts_count        IS DISTINCT FROM OLD.attempts_count        OR
     NEW.decided_by_admin_id   IS DISTINCT FROM OLD.decided_by_admin_id   OR
     NEW.decided_at            IS DISTINCT FROM OLD.decided_at            OR
     (NOT is_user_submission AND NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) OR
     NEW.rejection_reason      IS DISTINCT FROM OLD.rejection_reason      THEN
    RAISE EXCEPTION 'KYC: administrative fields are read-only for users';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (is_user_submission OR is_start_progress) THEN
    RAISE EXCEPTION 'KYC: transition % -> % is not allowed', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Users can update own kyc cases" ON public.kyc_cases;
CREATE POLICY "Users can update own kyc cases"
ON public.kyc_cases
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = ANY (ARRAY['NOT_STARTED','IN_PROGRESS','REJECTED'])
)
WITH CHECK (
  user_id = auth.uid()
  AND status = ANY (ARRAY['IN_PROGRESS','SUBMITTED'])
  AND decided_by_admin_id IS NULL
  AND decided_at IS NULL
  AND risk_score = 0
  AND level_required = ANY (ARRAY['LEVEL_1','LEVEL_2','LEVEL_3'])
);