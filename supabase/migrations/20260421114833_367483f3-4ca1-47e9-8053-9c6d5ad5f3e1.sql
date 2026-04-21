-- Trec bucket-ul pe privat
UPDATE storage.buckets SET public = false WHERE id = 'support-attachments';

-- Șterg politicile permisive existente (dacă există)
DROP POLICY IF EXISTS "Anyone can view support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users view own support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own support attachments" ON storage.objects;

-- SELECT: doar owner-ul folder-ului (path-ul începe cu user_id) sau admin
CREATE POLICY "Users view own support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- INSERT: doar în propriul folder
CREATE POLICY "Users upload to own folder support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: owner sau admin
CREATE POLICY "Users delete own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);