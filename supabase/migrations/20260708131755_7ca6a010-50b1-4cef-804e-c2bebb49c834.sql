-- 1. Drop the overly-broad, redundant trigger that blocked ALL user status updates.
DROP TRIGGER IF EXISTS trg_enforce_kyc_cases_user_update ON public.kyc_cases;

-- 2. Rewrite immutability trigger to allow the user to submit for the first time:
--    NULL -> now() on submitted_at, together with status -> SUBMITTED.
CREATE OR REPLACE FUNCTION public.enforce_kyc_case_user_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  is_user_submission boolean;
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

  -- Allowed transition: user marks their own case as submitted.
  is_user_submission :=
    OLD.status IN ('NOT_STARTED','IN_PROGRESS','REJECTED')
    AND NEW.status = 'SUBMITTED'
    AND OLD.submitted_at IS NULL
    AND NEW.submitted_at IS NOT NULL;

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
     AND NEW.status NOT IN ('NOT_STARTED','IN_PROGRESS','SUBMITTED') THEN
    RAISE EXCEPTION 'KYC: users cannot set status to %', NEW.status;
  END IF;

  RETURN NEW;
END;
$function$;