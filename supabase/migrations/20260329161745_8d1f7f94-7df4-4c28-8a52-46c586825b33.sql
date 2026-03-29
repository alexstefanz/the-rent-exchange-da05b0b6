
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

CREATE POLICY "Anyone can view support attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'support-attachments');
