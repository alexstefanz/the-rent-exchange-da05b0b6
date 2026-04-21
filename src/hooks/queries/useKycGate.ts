import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type KycStatus =
  | "NOT_VERIFIED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "NEEDS_MANUAL_REVIEW"
  | "VERIFIED"
  | "REJECTED";

/**
 * Central hook for KYC gating decisions.
 * Reads `profiles.kyc_status` for the current user and exposes
 * convenient flags for UI guards.
 */
export const useKycGate = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["kycGate", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_status, kyc_level")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("useKycGate: error fetching profile", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const status = (data?.kyc_status as KycStatus | undefined) ?? "NOT_VERIFIED";
  const isVerified = status === "VERIFIED";
  const isPending = status === "SUBMITTED" || status === "NEEDS_MANUAL_REVIEW";
  const isRejected = status === "REJECTED";
  const isInProgress = status === "IN_PROGRESS";
  const isNotStarted = status === "NOT_VERIFIED";

  return {
    status,
    isVerified,
    isPending,
    isRejected,
    isInProgress,
    isNotStarted,
    loading: authLoading || isLoading,
    hasUser: !!user,
  };
};