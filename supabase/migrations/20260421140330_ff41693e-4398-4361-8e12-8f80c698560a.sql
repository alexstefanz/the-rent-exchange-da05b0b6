-- Storage: allow users to update/delete their own files in kyc-documents bucket
CREATE POLICY "Users can update own kyc documents storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own kyc documents storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Relax kyc_cases UPDATE policy to allow REJECTED -> IN_PROGRESS and IN_PROGRESS -> SUBMITTED transitions
DROP POLICY IF EXISTS "Users can update own kyc cases" ON public.kyc_cases;
CREATE POLICY "Users can update own kyc cases"
  ON public.kyc_cases FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'SUBMITTED'))
  WITH CHECK (user_id = auth.uid());

-- Relax kyc_documents INSERT policy to allow uploads on SUBMITTED/REJECTED cases (reupload flow)
DROP POLICY IF EXISTS "Users can upload own kyc documents" ON public.kyc_documents;
CREATE POLICY "Users can upload own kyc documents"
  ON public.kyc_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.kyc_cases kc
      WHERE kc.id = kyc_case_id
        AND kc.user_id = auth.uid()
        AND kc.status IN ('NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'SUBMITTED')
    )
  );

-- Allow users to delete their own kyc documents (cleanup before reupload)
CREATE POLICY "Users can delete own kyc documents"
  ON public.kyc_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kyc_cases kc
      WHERE kc.id = kyc_case_id
        AND kc.user_id = auth.uid()
        AND kc.status IN ('NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'SUBMITTED')
    )
  );