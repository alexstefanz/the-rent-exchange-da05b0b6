DROP POLICY IF EXISTS "Anyone can read url scan cache" ON public.url_scan_cache;

CREATE POLICY "Authenticated users can read url scan cache"
ON public.url_scan_cache
FOR SELECT
TO authenticated
USING (true);