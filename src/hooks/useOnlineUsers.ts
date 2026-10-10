import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceStatus = "online" | "idle" | "offline";

const IDLE_AFTER_MS = 5 * 60 * 1000; // no activity for 5 min → idle (yellow)
const OFFLINE_AFTER_MS = 30 * 60 * 1000; // no activity for 30 min → offline

// Module-level store so one global channel serves the whole app.
let statuses = new Map<string, PresenceStatus>();
const listeners = new Set<(m: Map<string, PresenceStatus>) => void>();
const emit = () => listeners.forEach((l) => l(statuses));

/** Mount once (app-wide) for the signed-in user: broadcasts own status. */
export function useGlobalPresence(selfId: string | null | undefined) {
  useEffect(() => {
    if (!selfId) return;
    let channel: RealtimeChannel | null = supabase.channel("presence-global", {
      config: { presence: { key: selfId } },
    });
    let lastActivity = Date.now();
    let current: PresenceStatus | null = null;
    let subscribed = false;

    const publish = async (s: PresenceStatus) => {
      if (!channel || !subscribed || s === current) return;
      current = s;
      if (s === "offline") await channel.untrack();
      else await channel.track({ user_id: selfId, status: s, at: new Date().toISOString() });
    };

    const evaluate = () => {
      const idleFor = Date.now() - lastActivity;
      if (idleFor >= OFFLINE_AFTER_MS) publish("offline");
      else if (idleFor >= IDLE_AFTER_MS || document.visibilityState === "hidden") publish("idle");
      else publish("online");
    };

    let throttle = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - throttle < 2000 && current === "online") return;
      throttle = now;
      lastActivity = now;
      evaluate();
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel!.presenceState() as Record<string, Array<{ status?: PresenceStatus }>>;
        const next = new Map<string, PresenceStatus>();
        for (const [id, entries] of Object.entries(state)) {
          const anyOnline = entries.some((e) => (e.status ?? "online") === "online");
          next.set(id, anyOnline ? "online" : "idle");
        }
        statuses = next;
        emit();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          subscribed = true;
          current = null;
          evaluate();
        }
      });

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "focus"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const onVis = () => (document.visibilityState === "visible" ? onActivity() : evaluate());
    document.addEventListener("visibilitychange", onVis);
    const interval = window.setInterval(evaluate, 30_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
      channel = null;
      statuses = new Map();
      emit();
    };
  }, [selfId]);
}

/** Returns a map userId → status (missing = offline). */
export function useOnlineUsers(_selfId?: string | null) {
  const [map, setMap] = useState(statuses);
  useEffect(() => {
    const l = (m: Map<string, PresenceStatus>) => setMap(m);
    listeners.add(l);
    setMap(statuses);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return map;
}

export function getStatus(map: Map<string, PresenceStatus> | Set<string> | null | undefined, id?: string | null): PresenceStatus {
  if (!id || !map) return "offline";
  if (map instanceof Map) return map.get(id) || "offline";
  // Legacy shape (Set of online ids) kept by hot-reload state
  if (map instanceof Set) return map.has(id) ? "online" : "offline";
  return "offline";
}
