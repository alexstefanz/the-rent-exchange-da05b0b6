import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminNotifications,
  getAdminNotificationSummary,
  type AdminNotification,
  type AdminNotificationSummary,
} from "@/features/admin/adminNotificationsApi";
import { supabase } from "@/integrations/supabase/client";

export const useAdminNotifications = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_notifications" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-notifications"] });
          qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery<AdminNotification[]>({
    queryKey: ["admin-notifications"],
    queryFn: () => getAdminNotifications(50),
    staleTime: 30_000,
  });
};

export const useAdminNotificationSummary = () => {
  return useQuery<AdminNotificationSummary>({
    queryKey: ["admin-notification-summary"],
    queryFn: getAdminNotificationSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};