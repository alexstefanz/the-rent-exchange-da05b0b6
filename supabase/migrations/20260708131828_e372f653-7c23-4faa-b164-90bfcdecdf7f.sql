-- Redundant with prevent_kyc_self_privilege_escalation (which correctly allows
-- user transitions to IN_PROGRESS/SUBMITTED). This one blocks *all* status
-- changes for non-admins, so it also blocks legitimate user submissions.
DROP TRIGGER IF EXISTS trg_prevent_kyc_self_escalation ON public.kyc_cases;