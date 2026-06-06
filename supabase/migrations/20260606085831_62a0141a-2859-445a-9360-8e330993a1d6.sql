
-- 1. Remove products and profiles from realtime publication.
-- Realtime postgres_changes reads from WAL which contains ALL columns regardless
-- of column-level REVOKE, leaking sensitive fields (pickup coordinates, serial
-- numbers, admin flags, deactivation tokens) to any authenticated subscriber.
ALTER PUBLICATION supabase_realtime DROP TABLE public.products;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 2. Restrict user_warnings self-update to acknowledgement only.
-- Previously a warned user could overwrite reason/category/issued_by on their
-- own warning row.
DROP POLICY IF EXISTS "Users acknowledge own warnings" ON public.user_warnings;

CREATE POLICY "Users acknowledge own warnings"
ON public.user_warnings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND reason IS NOT DISTINCT FROM (SELECT uw.reason FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
  AND category IS NOT DISTINCT FROM (SELECT uw.category FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
  AND issued_by IS NOT DISTINCT FROM (SELECT uw.issued_by FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
  AND related_report_id IS NOT DISTINCT FROM (SELECT uw.related_report_id FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
  AND user_id IS NOT DISTINCT FROM (SELECT uw.user_id FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
  AND created_at IS NOT DISTINCT FROM (SELECT uw.created_at FROM public.user_warnings uw WHERE uw.id = user_warnings.id)
);
