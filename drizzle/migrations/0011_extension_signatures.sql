ALTER TABLE public.rental_extensions
  ADD COLUMN IF NOT EXISTS owner_signature_data text,
  ADD COLUMN IF NOT EXISTS renter_signature_data text,
  ADD COLUMN IF NOT EXISTS owner_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS renter_signed_at timestamptz;

CREATE OR REPLACE FUNCTION public.sign_rental_extension(_extension_id uuid, _signature text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.rental_extensions; r public.rentals; other uuid; both_signed boolean;
BEGIN
  IF _signature IS NULL OR length(_signature) < 100 OR _signature NOT LIKE 'data:image/png;base64,%' THEN
    RAISE EXCEPTION 'Semnătură invalidă.'; END IF;
  SELECT * INTO e FROM public.rental_extensions WHERE id = _extension_id FOR UPDATE;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Prelungirea nu a fost găsită.'; END IF;
  SELECT * INTO r FROM public.rentals WHERE id = e.rental_id;
  IF e.status <> 'approved' OR e.payment_status <> 'paid' THEN RAISE EXCEPTION 'Anexa 3 se semnează după plata prelungirii.'; END IF;
  IF auth.uid() = r.owner_id THEN
    IF e.owner_signed_at IS NOT NULL THEN RAISE EXCEPTION 'Ai semnat deja Anexa 3.'; END IF;
    UPDATE public.rental_extensions SET owner_signature_data=_signature, owner_signed_at=now() WHERE id=e.id;
    other := r.renter_id;
  ELSIF auth.uid() = r.renter_id THEN
    IF e.renter_signed_at IS NOT NULL THEN RAISE EXCEPTION 'Ai semnat deja Anexa 3.'; END IF;
    UPDATE public.rental_extensions SET renter_signature_data=_signature, renter_signed_at=now() WHERE id=e.id;
    other := r.owner_id;
  ELSE RAISE EXCEPTION 'Nu ești parte a acestei închirieri.'; END IF;
  SELECT owner_signed_at IS NOT NULL AND renter_signed_at IS NOT NULL INTO both_signed FROM public.rental_extensions WHERE id=e.id;
  PERFORM public.create_user_notification(other, 'extension_signed',
    CASE WHEN both_signed THEN 'Anexa 3 semnată de ambele părți' ELSE 'Semnează Anexa 3 (act adițional)' END,
    CASE WHEN both_signed THEN 'Annex 3 signed by both parties' ELSE 'Sign Annex 3 (addendum)' END,
    'Prelungirea închirierii ' || r.public_id, 'Extension of rental ' || r.public_id, '/inchirieri/' || r.public_id);
  RETURN both_signed;
END $$;

REVOKE ALL ON FUNCTION public.sign_rental_extension(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sign_rental_extension(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.extension_signature_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (OLD.owner_signed_at IS NOT NULL AND NEW.owner_signature_data IS DISTINCT FROM OLD.owner_signature_data)
     OR (OLD.renter_signed_at IS NOT NULL AND NEW.renter_signature_data IS DISTINCT FROM OLD.renter_signature_data) THEN
    RAISE EXCEPTION 'Semnăturile Anexei 3 nu pot fi modificate.'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_extension_signature_immutable ON public.rental_extensions;
CREATE TRIGGER trg_extension_signature_immutable BEFORE UPDATE ON public.rental_extensions
FOR EACH ROW EXECUTE FUNCTION public.extension_signature_immutable();