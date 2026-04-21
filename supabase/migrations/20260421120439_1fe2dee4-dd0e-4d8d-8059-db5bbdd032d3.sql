-- 1. RENTAL-INSPECTIONS BUCKET: make private + scoped policies
UPDATE storage.buckets SET public = false WHERE id = 'rental-inspections';

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Anyone can view rental inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload rental inspections" ON storage.objects;
DROP POLICY IF EXISTS "Public can view rental inspections" ON storage.objects;
DROP POLICY IF EXISTS "Rental inspections public read" ON storage.objects;
DROP POLICY IF EXISTS "Rental inspections authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Participants view rental inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Participants upload rental inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Participants delete rental inspection photos" ON storage.objects;

-- SELECT: rental participants (owner/renter) or admin
CREATE POLICY "Participants view rental inspection photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'rental-inspections'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM rentals r
      WHERE r.id::text = (storage.foldername(name))[1]
        AND (r.owner_id = auth.uid() OR r.renter_id = auth.uid())
    )
  )
);

-- INSERT: must be participant of the rental, in own user folder
CREATE POLICY "Participants upload rental inspection photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'rental-inspections'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND EXISTS (
    SELECT 1 FROM rentals r
    WHERE r.id::text = (storage.foldername(name))[1]
      AND (r.owner_id = auth.uid() OR r.renter_id = auth.uid())
  )
);

-- DELETE: uploader or admin
CREATE POLICY "Participants delete rental inspection photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'rental-inspections'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid()::text = (storage.foldername(name))[2]
  )
);

-- 2. EMAIL-ASSETS BUCKET: tighten INSERT to admins
DROP POLICY IF EXISTS "Admin upload for email assets" ON storage.objects;

CREATE POLICY "Admin upload for email assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'email-assets'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Also restrict UPDATE/DELETE to admins
DROP POLICY IF EXISTS "Admin update email assets" ON storage.objects;
CREATE POLICY "Admin update email assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin delete email assets" ON storage.objects;
CREATE POLICY "Admin delete email assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. REALTIME CHANNEL AUTHORIZATION
-- Enable RLS on realtime.messages and add policies that scope channel access to participants.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated channel access" ON realtime.messages;

-- Allow only authenticated users to subscribe to postgres_changes for tables they have RLS access to.
-- Realtime already filters by RLS for postgres_changes, but we explicitly scope channel-level reads:
CREATE POLICY "Authenticated channel access"
ON realtime.messages FOR SELECT TO authenticated
USING (
  -- Postgres-changes events are filtered by table RLS by realtime itself.
  -- For broadcast/presence channels, restrict to channels owned/participated by the user.
  (extension = 'postgres_changes')
  OR (extension = 'broadcast' AND topic LIKE 'user:' || auth.uid()::text || ':%')
  OR (extension = 'presence' AND topic LIKE 'user:' || auth.uid()::text || ':%')
);