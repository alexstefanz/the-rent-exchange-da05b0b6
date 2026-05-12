
-- 1. Add rejection_reason on rentals (motiv refuz)
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. PV documents table
CREATE TABLE IF NOT EXISTS public.rental_pv_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('handover','return')),
  pdf_path text,
  photos text[] NOT NULL DEFAULT '{}',
  owner_signature_data text,
  renter_signature_data text,
  owner_signed_at timestamptz,
  renter_signed_at timestamptz,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rental_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_rental_pv_docs_rental ON public.rental_pv_documents(rental_id);

ALTER TABLE public.rental_pv_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view PV docs" ON public.rental_pv_documents;
CREATE POLICY "Participants view PV docs"
  ON public.rental_pv_documents FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_pv_documents.rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants insert PV docs" ON public.rental_pv_documents;
CREATE POLICY "Participants insert PV docs"
  ON public.rental_pv_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_pv_documents.rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants update PV docs" ON public.rental_pv_documents;
CREATE POLICY "Participants update PV docs"
  ON public.rental_pv_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_pv_documents.rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_pv_documents.rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.update_rental_pv_documents_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_rental_pv_docs_updated_at ON public.rental_pv_documents;
CREATE TRIGGER trg_rental_pv_docs_updated_at
  BEFORE UPDATE ON public.rental_pv_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_rental_pv_documents_updated_at();

-- 3. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('rental-pvs', 'rental-pvs', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies — folder per rental id; participants & admins
DROP POLICY IF EXISTS "PV bucket participants read" ON storage.objects;
CREATE POLICY "PV bucket participants read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'rental-pvs'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.rentals r
        WHERE r.id::text = (storage.foldername(name))[1]
          AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "PV bucket participants write" ON storage.objects;
CREATE POLICY "PV bucket participants write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rental-pvs'
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id::text = (storage.foldername(name))[1]
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "PV bucket participants update" ON storage.objects;
CREATE POLICY "PV bucket participants update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rental-pvs'
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id::text = (storage.foldername(name))[1]
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

-- 4. RPC to fetch a signed URL for a stored PV (1h)
CREATE OR REPLACE FUNCTION public.get_rental_pv_signed_url(_rental_id uuid, _phase text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _path text;
  _allowed boolean;
BEGIN
  SELECT (auth.uid() IS NOT NULL) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM rentals r WHERE r.id = _rental_id AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid()))
  ) INTO _allowed;
  IF NOT _allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT pdf_path INTO _path FROM rental_pv_documents
   WHERE rental_id = _rental_id AND phase = _phase;
  RETURN _path;
END $$;
