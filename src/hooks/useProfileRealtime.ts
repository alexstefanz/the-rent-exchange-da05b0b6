import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to live changes on the current user's profile row so the
 * Account Hub stays in sync across devices and admin edits.
 */
export function useProfileRealtime(userId: string | undefined, onChange?: () => void) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["currentUserProfile", userId] });
          qc.invalidateQueries({ queryKey: ["userStatistics", userId] });
          onChange?.();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, onChange]);
}