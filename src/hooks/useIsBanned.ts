import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";

/**
 * Returns the current user's ban status. Reads from the cached profile
 * (refreshes every 30s) and does not block render.
 */
export function useIsBanned() {
  const { data: profile } = useCurrentUserProfile();
  return {
    isBanned: !!profile?.is_banned,
    banReason: profile?.ban_reason ?? null,
  };
}