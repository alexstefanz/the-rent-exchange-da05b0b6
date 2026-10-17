import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function useIdentityVerified(userId?: string | null) {
  return useQuery({
    queryKey: ["identityVerified", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_identity_verified", { _user_id: userId! });
      return data === true;
    },
  });
}

export function IdentityVerifiedBadge({ userId, compact = false }: { userId?: string | null; compact?: boolean }) {
  const { data: verified } = useIdentityVerified(userId);
  if (!verified) return null;
  return (
    <span
      title="Identitate verificată"
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {!compact && "Identitate verificată"}
    </span>
  );
}
