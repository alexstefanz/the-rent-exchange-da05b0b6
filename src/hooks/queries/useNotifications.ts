import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/features/profile/notificationsApi";
import { supabase } from "@/integrations/supabase/client";

const KEY = ["notifications"] as const;

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: getNotifications,
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Realtime subscription — optimistically prepend INSERTs, patch UPDATEs.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as Notification;
          queryClient.setQueryData<Notification[]>(KEY, (prev) => {
            if (!prev) return [next];
            if (prev.some((n) => n.id === next.id)) return prev;
            return [next, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as Notification;
          queryClient.setQueryData<Notification[]>(KEY, (prev) =>
            prev ? prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)) : prev,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const old = payload.old as { id: string };
          queryClient.setQueryData<Notification[]>(KEY, (prev) =>
            prev ? prev.filter((n) => n.id !== old.id) : prev,
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[notifications-realtime] status:", status);
        }
        if (status === "SUBSCRIBED") {
          // Catch any INSERT that fired between login and channel readiness.
          queryClient.invalidateQueries({ queryKey: KEY });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Resilience: refetch on tab focus / visibility change so the bell badge
  // stays correct even if the websocket dropped briefly.
  useEffect(() => {
    if (!userId) return;
    const refetch = () => queryClient.invalidateQueries({ queryKey: KEY });
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, queryClient]);

  const markRead = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const prev = queryClient.getQueryData<Notification[]>(KEY);
      queryClient.setQueryData<Notification[]>(KEY, (old) =>
        old ? old.map((n) => (n.id === id ? { ...n, is_read: true } : n)) : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEY, ctx.prev);
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const prev = queryClient.getQueryData<Notification[]>(KEY);
      queryClient.setQueryData<Notification[]>(KEY, (old) =>
        old ? old.map((n) => ({ ...n, is_read: true })) : old,
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEY, ctx.prev);
    },
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markAsRead: (id: string) => markRead.mutate(id),
    markAllAsRead: () => markAll.mutate(),
  };
}