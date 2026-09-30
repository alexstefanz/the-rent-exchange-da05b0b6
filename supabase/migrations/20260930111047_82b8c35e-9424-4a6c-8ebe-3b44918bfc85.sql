CREATE OR REPLACE FUNCTION public.enforce_pv_signature_party()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_renter uuid;
  v_owner  uuid;
  v_uid    uuid := auth.uid();
  v_is_admin boolean;
  v_last_sig timestamptz;
BEGIN
  -- Service role bypasses everything.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_is_admin := v_uid IS NOT NULL AND public.has_role(v_uid, 'admin'::public.app_role);
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  SELECT r.renter_id, r.owner_id
    INTO v_renter, v_owner
    FROM public.rentals r
   WHERE r.id = NEW.rental_id;

  -- Identity of the document is immutable.
  IF NEW.rental_id IS DISTINCT FROM OLD.rental_id
     OR NEW.phase IS DISTINCT FROM OLD.phase
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'PV document identity cannot be modified';
  END IF;

  -- Once a signature is captured it is immutable for everyone except admins/service role.
  IF OLD.owner_signature_data IS NOT NULL
     AND (NEW.owner_signature_data IS DISTINCT FROM OLD.owner_signature_data
          OR NEW.owner_signed_at  IS DISTINCT FROM OLD.owner_signed_at) THEN
    RAISE EXCEPTION 'Owner signature is already captured and cannot be modified';
  END IF;

  IF OLD.renter_signature_data IS NOT NULL
     AND (NEW.renter_signature_data IS DISTINCT FROM OLD.renter_signature_data
          OR NEW.renter_signed_at  IS DISTINCT FROM OLD.renter_signed_at) THEN
    RAISE EXCEPTION 'Renter signature is already captured and cannot be modified';
  END IF;

  -- pdf_path / generated_at are write-once, EXCEPT for the one upgrade from a
  -- provisional PDF (rendered before both parties signed) to the final fully
  -- signed document. Timestamp of the last signature decides.
  v_last_sig := GREATEST(
    COALESCE(NEW.owner_signed_at, '-infinity'::timestamptz),
    COALESCE(NEW.renter_signed_at, '-infinity'::timestamptz)
  );

  IF NOT (NEW.owner_signed_at IS NOT NULL
          AND NEW.renter_signed_at IS NOT NULL
          AND (OLD.generated_at IS NULL OR OLD.generated_at < v_last_sig)) THEN
    IF OLD.pdf_path IS NOT NULL
       AND NEW.pdf_path IS DISTINCT FROM OLD.pdf_path THEN
      RAISE EXCEPTION 'PV pdf_path is already set and cannot be modified';
    END IF;

    IF OLD.generated_at IS NOT NULL
       AND NEW.generated_at IS DISTINCT FROM OLD.generated_at THEN
      RAISE EXCEPTION 'PV generated_at is already set and cannot be modified';
    END IF;
  END IF;

  -- Evidence (photos) is frozen as soon as any party has signed, or the PDF was generated.
  IF (OLD.owner_signature_data IS NOT NULL
      OR OLD.renter_signature_data IS NOT NULL
      OR OLD.pdf_path IS NOT NULL)
     AND (NEW.photos IS DISTINCT FROM OLD.photos
          OR NEW.photos_meta IS DISTINCT FROM OLD.photos_meta) THEN
    RAISE EXCEPTION 'PV photos cannot be modified after signing';
  END IF;

  -- Renters may not touch owner signature fields.
  IF v_uid = v_renter THEN
    IF NEW.owner_signature_data IS DISTINCT FROM OLD.owner_signature_data
       OR NEW.owner_signed_at  IS DISTINCT FROM OLD.owner_signed_at THEN
      RAISE EXCEPTION 'Renters cannot modify owner signature fields';
    END IF;
  END IF;

  -- Owners may not touch renter signature fields.
  IF v_uid = v_owner THEN
    IF NEW.renter_signature_data IS DISTINCT FROM OLD.renter_signature_data
       OR NEW.renter_signed_at  IS DISTINCT FROM OLD.renter_signed_at THEN
      RAISE EXCEPTION 'Owners cannot modify renter signature fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;