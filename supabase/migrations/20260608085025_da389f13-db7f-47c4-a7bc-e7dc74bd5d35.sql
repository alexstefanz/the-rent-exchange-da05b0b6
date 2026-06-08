
-- 1. KYC self-approve hardening: validate via trigger so non-admins can't change protected fields
CREATE OR REPLACE FUNCTION public.prevent_kyc_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Only allow user-initiated transitions to IN_PROGRESS or SUBMITTED
    IF NEW.status NOT IN ('IN_PROGRESS', 'SUBMITTED') THEN
      RAISE EXCEPTION 'Not allowed to set KYC status to %', NEW.status USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.risk_score IS DISTINCT FROM OLD.risk_score
     OR NEW.level_required IS DISTINCT FROM OLD.level_required
     OR NEW.decided_by_admin_id IS DISTINCT FROM OLD.decided_by_admin_id
     OR NEW.decided_at IS DISTINCT FROM OLD.decided_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.attempts_count IS DISTINCT FROM OLD.attempts_count
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify protected KYC fields' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_kyc_self_privilege_escalation ON public.kyc_cases;
CREATE TRIGGER trg_prevent_kyc_self_privilege_escalation
BEFORE UPDATE ON public.kyc_cases
FOR EACH ROW
EXECUTE FUNCTION public.prevent_kyc_self_privilege_escalation();

-- 2. Hide product serial numbers from the public Data API
REVOKE SELECT (serial_number) ON public.products FROM anon;
REVOKE SELECT (serial_number) ON public.products FROM authenticated;
-- service_role retains full access for admin/edge function use
