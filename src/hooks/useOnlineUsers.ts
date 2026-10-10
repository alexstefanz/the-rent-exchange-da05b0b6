import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Global presence: returns the set of currently online user ids. */
export function useOnlineUsers(selfId: string | null | undefined) {
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selfId) return;
    const channel = supabase.channel("presence-global", {
      config: { presence: { key: selfId } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnline(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: selfId, online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selfId]);

  return online;
}
