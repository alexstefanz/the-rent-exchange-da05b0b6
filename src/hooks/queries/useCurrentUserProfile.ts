import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCurrentUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["currentUserProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email, phone, sms_notifications_enabled, phone_verified, iban, is_banned, ban_reason")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching current user profile:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30s — keep banners (e.g. PhoneRequiredGate) fresh after profile edits
  });
};
