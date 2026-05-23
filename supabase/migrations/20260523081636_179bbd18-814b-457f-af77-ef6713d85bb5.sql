-- Restrict url_scan_cache SELECT to admins/service_role only
DROP POLICY IF EXISTS "Authenticated users can read url scan cache" ON public.url_scan_cache;

-- Add explicit admin SELECT policy on anaf_cache so it is no longer "RLS enabled / no policy"
-- Edge functions continue to use service_role which bypasses RLS.
CREATE POLICY "Admins can read anaf cache"
ON public.anaf_cache
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));