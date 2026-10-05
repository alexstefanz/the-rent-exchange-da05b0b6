CREATE OR REPLACE FUNCTION public.enforce_pv_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL AND public.has_role(v_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- A captured signature can never be changed or removed.
  IF OLD.owner_signed_at IS NOT NULL AND (
       NEW.owner_signature_data IS DISTINCT FROM OLD.owner_signature_data
    OR NEW.owner_signed_at IS DISTINCT FROM OLD.owner_signed_at) THEN
    RAISE EXCEPTION 'PV_SEALED: Semnatura proprietarului este deja inregistrata si nu poate fi modificata.';
  END IF;
  IF OLD.renter_signed_at IS NOT NULL AND (
       NEW.renter_signature_data IS DISTINCT FROM OLD.renter_signature_data
    OR NEW.renter_signed_at IS DISTINCT FROM OLD.renter_signed_at) THEN
    RAISE EXCEPTION 'PV_SEALED: Semnatura chiriasului este deja inregistrata si nu poate fi modificata.';
  END IF;

  -- Once anyone has signed, the photo evidence is frozen.
  IF (OLD.owner_signed_at IS NOT NULL OR OLD.renter_signed_at IS NOT NULL) AND (
       NEW.photos IS DISTINCT FROM OLD.photos
    OR NEW.photos_meta IS DISTINCT FROM OLD.photos_meta) THEN
    RAISE EXCEPTION 'PV_SEALED: Fotografiile nu mai pot fi modificate dupa semnare.';
  END IF;

  -- Fully signed: only the first archival of the final PDF is allowed.
  IF OLD.owner_signed_at IS NOT NULL AND OLD.renter_signed_at IS NOT NULL THEN
    IF NEW.pdf_path IS DISTINCT FROM OLD.pdf_path THEN
      IF OLD.pdf_path IS NOT NULL AND position('/generated/' in OLD.pdf_path) = 0 THEN
        RAISE EXCEPTION 'PV_SEALED: Documentul PV este finalizat si sigilat; modificarile sunt interzise.';
      END IF;
    END IF;
    IF NEW.rental_id IS DISTINCT FROM OLD.rental_id OR NEW.phase IS DISTINCT FROM OLD.phase THEN
      RAISE EXCEPTION 'PV_SEALED: Documentul PV este finalizat si sigilat; modificarile sunt interzise.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pv_immutability ON public.rental_pv_documents;
CREATE TRIGGER trg_enforce_pv_immutability
  BEFORE UPDATE ON public.rental_pv_documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pv_immutability();

-- Signed PV files in storage cannot be overwritten by participants.
DROP POLICY IF EXISTS "PV bucket participants update" ON storage.objects;