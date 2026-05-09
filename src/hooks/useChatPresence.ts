import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceState {
  peerOnline: boolean;
  peerTyping: boolean;
  peerLastSeen: string | null;
}

/**
 * Tracks presence + typing for a 1:1 chat. Self joins channel with own user_id.
 * Caller invokes `setTyping(true)` while user types; auto resets after 2.5s.
 */
export function useChatPresence(conversationId: string | null, selfId: string | null, peerId: string | null) {
  const [state, setState] = useState<PresenceState>({
    peerOnline: false,
    peerTyping: false,
    peerLastSeen: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !selfId) return;

    const channel = supabase.channel(`presence-conv-${conversationId}`, {
      config: { presence: { key: selfId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState() as Record<string, Array<{ user_id: string; typing: boolean; online_at: string }>>;
        const peerEntries = peerId ? presenceState[peerId] : undefined;
        if (peerEntries && peerEntries.length > 0) {
          const latest = peerEntries[peerEntries.length - 1];
          setState((prev) => ({
            peerOnline: true,
            peerTyping: !!latest.typing,
            peerLastSeen: latest.online_at || prev.peerLastSeen,
          }));
        } else {
          setState((prev) => ({ ...prev, peerOnline: false, peerTyping: false }));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: selfId,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, selfId, peerId]);

  const setTyping = (typing: boolean) => {
    const channel = channelRef.current;
    if (!channel || !selfId) return;
    if (typing === isTypingRef.current && typing) {
      // refresh debounce
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => setTyping(false), 2500);
      return;
    }
    isTypingRef.current = typing;
    channel.track({
      user_id: selfId,
      typing,
      online_at: new Date().toISOString(),
    });
    if (typing) {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => setTyping(false), 2500);
    }
  };

  return { ...state, setTyping };
}