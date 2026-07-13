DROP POLICY IF EXISTS "Anyone can read url allowlist" ON public.url_allowlist;
REVOKE SELECT ON public.url_allowlist FROM anon;