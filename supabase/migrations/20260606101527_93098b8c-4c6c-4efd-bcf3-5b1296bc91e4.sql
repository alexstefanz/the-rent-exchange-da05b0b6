-- Restrict which columns non-admin users may change on their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND NOT public.is_user_banned(auth.uid())
  -- Admin-managed / security-sensitive fields must remain unchanged for non-admins.
  AND is_banned       IS NOT DISTINCT FROM (SELECT p.is_banned       FROM public.profiles p WHERE p.id = profiles.id)
  AND banned_at       IS NOT DISTINCT FROM (SELECT p.banned_at       FROM public.profiles p WHERE p.id = profiles.id)
  AND banned_by       IS NOT DISTINCT FROM (SELECT p.banned_by       FROM public.profiles p WHERE p.id = profiles.id)
  AND ban_reason      IS NOT DISTINCT FROM (SELECT p.ban_reason      FROM public.profiles p WHERE p.id = profiles.id)
  AND kyc_status      IS NOT DISTINCT FROM (SELECT p.kyc_status      FROM public.profiles p WHERE p.id = profiles.id)
  AND kyc_level       IS NOT DISTINCT FROM (SELECT p.kyc_level       FROM public.profiles p WHERE p.id = profiles.id)
  AND phone_verified  IS NOT DISTINCT FROM (SELECT p.phone_verified  FROM public.profiles p WHERE p.id = profiles.id)
  AND is_deactivated  IS NOT DISTINCT FROM (SELECT p.is_deactivated  FROM public.profiles p WHERE p.id = profiles.id)
);