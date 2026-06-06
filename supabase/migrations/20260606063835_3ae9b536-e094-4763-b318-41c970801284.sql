
-- 1) Lock down sensitive columns on public.products from direct client SELECT.
--    Owners/admins must read these via SECURITY DEFINER RPCs (already used in the app).
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number,
               admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM anon, authenticated;

-- 2) Lock down deactivation token columns on public.profiles from any client SELECT.
--    These are credentials, only edge functions (service_role) need them.
REVOKE SELECT (deactivation_token, deactivation_token_expires_at)
  ON public.profiles FROM anon, authenticated;

-- 3) Enforce per-party signature integrity on rental_pv_documents.
--    Previously any rental participant could overwrite the other party's signature.
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
BEGIN
  -- Admins bypass this check.
  IF public.has_role(v_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  SELECT r.renter_id, r.owner_id
    INTO v_renter, v_owner
    FROM public.rentals r
   WHERE r.id = NEW.rental_id;

  -- If caller is the renter, block any change to owner's signature columns.
  IF v_uid = v_renter THEN
    IF NEW.owner_signature_data IS DISTINCT FROM OLD.owner_signature_data
       OR NEW.owner_signed_at  IS DISTINCT FROM OLD.owner_signed_at THEN
      RAISE EXCEPTION 'Renters cannot modify owner signature fields';
    END IF;
  END IF;

  -- If caller is the owner, block any change to renter's signature columns.
  IF v_uid = v_owner THEN
    IF NEW.renter_signature_data IS DISTINCT FROM OLD.renter_signature_data
       OR NEW.renter_signed_at  IS DISTINCT FROM OLD.renter_signed_at THEN
      RAISE EXCEPTION 'Owners cannot modify renter signature fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pv_signature_party ON public.rental_pv_documents;
CREATE TRIGGER trg_enforce_pv_signature_party
  BEFORE UPDATE ON public.rental_pv_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pv_signature_party();
