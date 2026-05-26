-- Realtime RLS audit follow-ups

-- 1) Remove user_blocks from realtime publication: no client subscribes to it,
--    and SELECT policy is admin-only so it would deliver nothing to users anyway.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_blocks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.user_blocks';
  END IF;
END $$;

-- 2) Allow a user to see favorite_users rows where they are the favorited party,
--    so the "someone favorited me" realtime tick in useGlobalRealtime actually fires.
--    Follower lists are already exposed via public stats; this only widens row
--    visibility for the favorited user, not for third parties.
DROP POLICY IF EXISTS "Users can view follows pointing at them" ON public.favorite_users;
CREATE POLICY "Users can view follows pointing at them"
ON public.favorite_users
FOR SELECT
TO authenticated
USING (favorite_user_id = auth.uid());
