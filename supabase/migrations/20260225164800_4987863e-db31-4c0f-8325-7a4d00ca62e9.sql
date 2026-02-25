
-- =============================================
-- KYC Module v2: Complete Rebuild
-- =============================================

-- 1. Drop old kyc_verifications table
DROP TABLE IF EXISTS public.kyc_verifications CASCADE;

-- 2. Create sequence for public_id
CREATE SEQUENCE IF NOT EXISTS public.kyc_case_seq START WITH 1;

-- 3. Create kyc_cases table
CREATE TABLE public.kyc_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL DEFAULT 'KYC-000000',
  user_id uuid NOT NULL,
  user_role text NOT NULL DEFAULT 'RENTER',
  level_required text NOT NULL DEFAULT 'LEVEL_1',
  status text NOT NULL DEFAULT 'NOT_STARTED',
  rejection_reason text,
  provider_name text,
  provider_case_id text,
  attempts_count integer NOT NULL DEFAULT 1,
  risk_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by_admin_id uuid
);

-- Indexes
CREATE UNIQUE INDEX idx_kyc_cases_public_id ON public.kyc_cases(public_id);
CREATE INDEX idx_kyc_cases_user_id ON public.kyc_cases(user_id);
CREATE INDEX idx_kyc_cases_status ON public.kyc_cases(status);
CREATE INDEX idx_kyc_cases_user_role ON public.kyc_cases(user_role);

-- 4. Auto-generate public_id trigger
CREATE OR REPLACE FUNCTION public.generate_kyc_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('kyc_case_seq');
  NEW.public_id := 'KYC-' || lpad(next_val::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kyc_public_id
  BEFORE INSERT ON public.kyc_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_kyc_public_id();

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_kyc_cases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kyc_cases_updated_at
  BEFORE UPDATE ON public.kyc_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kyc_cases_updated_at();

-- 6. Create kyc_documents table
CREATE TABLE public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_case_id uuid NOT NULL REFERENCES public.kyc_cases(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_documents_case_id ON public.kyc_documents(kyc_case_id);

-- 7. Create kyc_audit_log table
CREATE TABLE public.kyc_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_case_id uuid NOT NULL REFERENCES public.kyc_cases(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value text,
  new_value text,
  actor_type text NOT NULL DEFAULT 'SYSTEM',
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_audit_log_case_id ON public.kyc_audit_log(kyc_case_id);

-- 8. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'NOT_VERIFIED',
  ADD COLUMN IF NOT EXISTS kyc_level text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS kyc_last_verified_at timestamptz;

-- 9. Enable RLS
ALTER TABLE public.kyc_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_audit_log ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies - Admin
CREATE POLICY "Admins full access on kyc_cases"
  ON public.kyc_cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins full access on kyc_documents"
  ON public.kyc_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins full access on kyc_audit_log"
  ON public.kyc_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. RLS Policies - Users can view/create their own KYC cases
CREATE POLICY "Users can view own kyc cases"
  ON public.kyc_cases FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own kyc cases"
  ON public.kyc_cases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own kyc cases"
  ON public.kyc_cases FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('NOT_STARTED', 'IN_PROGRESS'));

-- Users can view/upload documents on their own cases
CREATE POLICY "Users can view own kyc documents"
  ON public.kyc_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kyc_cases kc
    WHERE kc.id = kyc_case_id AND kc.user_id = auth.uid()
  ));

CREATE POLICY "Users can upload own kyc documents"
  ON public.kyc_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.kyc_cases kc
      WHERE kc.id = kyc_case_id AND kc.user_id = auth.uid()
      AND kc.status IN ('NOT_STARTED', 'IN_PROGRESS')
    )
  );

-- 12. Storage bucket for KYC documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: admin can do everything
CREATE POLICY "Admins can manage kyc documents storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own kyc documents storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own kyc documents storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 13. DB function to get KYC cases for admin list
CREATE OR REPLACE FUNCTION public.get_admin_kyc_cases(
  status_filter text DEFAULT NULL,
  role_filter text DEFAULT NULL,
  level_filter text DEFAULT NULL,
  search_query text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  public_id text,
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  level_required text,
  status text,
  rejection_reason text,
  provider_name text,
  attempts_count integer,
  risk_score integer,
  created_at timestamptz,
  updated_at timestamptz,
  submitted_at timestamptz,
  decided_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    kc.id,
    kc.public_id,
    kc.user_id,
    COALESCE(p.full_name, 'Utilizator') as user_name,
    COALESCE(p.email, '') as user_email,
    kc.user_role,
    kc.level_required,
    kc.status,
    kc.rejection_reason,
    kc.provider_name,
    kc.attempts_count,
    kc.risk_score,
    kc.created_at,
    kc.updated_at,
    kc.submitted_at,
    kc.decided_at
  FROM kyc_cases kc
  LEFT JOIN profiles p ON p.id = kc.user_id
  WHERE
    (status_filter IS NULL OR kc.status = status_filter)
    AND (role_filter IS NULL OR kc.user_role = role_filter)
    AND (level_filter IS NULL OR kc.level_required = level_filter)
    AND (search_query IS NULL OR
      kc.public_id ILIKE '%' || search_query || '%' OR
      p.full_name ILIKE '%' || search_query || '%' OR
      p.email ILIKE '%' || search_query || '%'
    )
  ORDER BY kc.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
