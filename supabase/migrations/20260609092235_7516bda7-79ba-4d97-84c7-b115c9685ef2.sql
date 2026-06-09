
-- =========================================================
-- 1. KYC cases: column-level immutability for self-update
-- =========================================================
DROP POLICY IF EXISTS "Users can update own kyc cases" ON public.kyc_cases;

CREATE POLICY "Users can update own kyc cases"
ON public.kyc_cases
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = ANY (ARRAY['NOT_STARTED','IN_PROGRESS','REJECTED','SUBMITTED'])
)
WITH CHECK (
  user_id = auth.uid()
);

-- BEFORE UPDATE trigger that freezes admin-managed columns for non-admins.
CREATE OR REPLACE FUNCTION public.enforce_kyc_case_user_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Service role / admins bypass.
  IF auth.role() = 'service_role'
     OR public.has_role(v_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Only enforce for self-updates (the policy already restricts this path).
  IF v_uid <> OLD.user_id THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id              IS DISTINCT FROM OLD.user_id              OR
     NEW.risk_score            IS DISTINCT FROM OLD.risk_score            OR
     NEW.level_required        IS DISTINCT FROM OLD.level_required        OR
     NEW.user_role             IS DISTINCT FROM OLD.user_role             OR
     NEW.provider_case_id      IS DISTINCT FROM OLD.provider_case_id      OR
     NEW.provider_name         IS DISTINCT FROM OLD.provider_name         OR
     NEW.attempts_count        IS DISTINCT FROM OLD.attempts_count        OR
     NEW.decided_by_admin_id   IS DISTINCT FROM OLD.decided_by_admin_id   OR
     NEW.decided_at            IS DISTINCT FROM OLD.decided_at            OR
     NEW.submitted_at          IS DISTINCT FROM OLD.submitted_at          OR
     NEW.rejection_reason      IS DISTINCT FROM OLD.rejection_reason      THEN
    RAISE EXCEPTION 'KYC: administrative fields are read-only for users';
  END IF;

  -- Status: users may only move between NOT_STARTED / IN_PROGRESS / SUBMITTED.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('NOT_STARTED','IN_PROGRESS','SUBMITTED') THEN
    RAISE EXCEPTION 'KYC: users cannot set status to %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_kyc_case_user_immutability ON public.kyc_cases;
CREATE TRIGGER trg_enforce_kyc_case_user_immutability
BEFORE UPDATE ON public.kyc_cases
FOR EACH ROW EXECUTE FUNCTION public.enforce_kyc_case_user_immutability();


-- =========================================================
-- 2. Storage: scope public reads to active+approved listings
-- =========================================================
DROP POLICY IF EXISTS "View images of active products or own images" ON storage.objects;

CREATE POLICY "View images of active approved products or own images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (
    -- Owner can always see their own files.
    (auth.uid())::text = (storage.foldername(name))[1]
    -- Public can see only files referenced by an active + approved product.
    OR EXISTS (
      SELECT 1
      FROM public.products p
      WHERE (p.owner_id)::text = (storage.foldername(objects.name))[1]
        AND p.is_active = true
        AND p.approval_status = 'approved'
        AND EXISTS (
          SELECT 1 FROM unnest(p.images) AS img
          WHERE img LIKE '%/' || objects.name
        )
    )
  )
);


-- =========================================================
-- 3. Rental PV documents: signature & pdf_path immutability
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_pv_signature_party()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_renter uuid;
  v_owner  uuid;
  v_uid    uuid := auth.uid();
  v_is_admin boolean;
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

  -- pdf_path is write-once.
  IF OLD.pdf_path IS NOT NULL
     AND NEW.pdf_path IS DISTINCT FROM OLD.pdf_path THEN
    RAISE EXCEPTION 'PV pdf_path is already set and cannot be modified';
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
