CREATE OR REPLACE FUNCTION public.enforce_pv_gates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_co int;
  renter_co int;
  owner_ci int;
  renter_ci int;
  pv_handover_owner int;
  pv_handover_renter int;
  pv_return_owner int;
  pv_return_renter int;
BEGIN
  -- Block any state changes while a dispute is open (admin bypass).
  IF OLD.dispute_status = 'open'
     AND NEW.dispute_status = 'open'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.handover_confirmed_at IS DISTINCT FROM OLD.handover_confirmed_at
          OR NEW.return_confirmed_at IS DISTINCT FROM OLD.return_confirmed_at)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'DISPUTE_OPEN' USING ERRCODE = 'P0001';
  END IF;

  -- Gate handover_confirmed_at: requires both checkout inspections OR signed handover PV docs.
  IF NEW.handover_confirmed_at IS NOT NULL
     AND OLD.handover_confirmed_at IS NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN

    SELECT COUNT(*) INTO owner_co
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkout' AND role = 'owner'
       AND array_length(photos, 1) >= 3;
    SELECT COUNT(*) INTO renter_co
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkout' AND role = 'renter'
       AND array_length(photos, 1) >= 3;

    SELECT COUNT(*) INTO pv_handover_owner
      FROM rental_pv_documents
     WHERE rental_id = NEW.id AND phase = 'handover' AND owner_signed_at IS NOT NULL;
    SELECT COUNT(*) INTO pv_handover_renter
      FROM rental_pv_documents
     WHERE rental_id = NEW.id AND phase = 'handover' AND renter_signed_at IS NOT NULL;

    IF (owner_co = 0 OR renter_co = 0)
       AND (pv_handover_owner = 0 OR pv_handover_renter = 0) THEN
      RAISE EXCEPTION 'PV_INCOMPLETE_HANDOVER' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Gate return_confirmed_at: requires both checkin inspections OR signed return PV docs.
  IF NEW.return_confirmed_at IS NOT NULL
     AND OLD.return_confirmed_at IS NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN

    SELECT COUNT(*) INTO owner_ci
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkin' AND role = 'owner'
       AND array_length(photos, 1) >= 3;
    SELECT COUNT(*) INTO renter_ci
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkin' AND role = 'renter'
       AND array_length(photos, 1) >= 3;

    SELECT COUNT(*) INTO pv_return_owner
      FROM rental_pv_documents
     WHERE rental_id = NEW.id AND phase = 'return' AND owner_signed_at IS NOT NULL;
    SELECT COUNT(*) INTO pv_return_renter
      FROM rental_pv_documents
     WHERE rental_id = NEW.id AND phase = 'return' AND renter_signed_at IS NOT NULL;

    IF (owner_ci = 0 OR renter_ci = 0)
       AND (pv_return_owner = 0 OR pv_return_renter = 0) THEN
      RAISE EXCEPTION 'PV_INCOMPLETE_RETURN' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;