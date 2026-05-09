import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime changes on a single ticket's messages and on the ticket row.
 * Invalidates the relevant React Query caches so the UI updates instantly.
 */
export function useTicketRealtime(ticketId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["userTicketMessages", ticketId] });
          qc.invalidateQueries({ queryKey: ["supportChatMessages", ticketId] });
          qc.invalidateQueries({ queryKey: ["userTickets"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ops_tickets", filter: `id=eq.${ticketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["userTickets"] });
          qc.invalidateQueries({ queryKey: ["supportTicketInfo", ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, qc]);
}

/**
 * Subscribe to all the user's tickets list (any insert/update on ops_tickets where they are requester).
 * Used by the inbox to refresh when admin reassigns or status changes.
 */
export function useUserTicketsRealtime(userId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`user-tickets:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tickets", filter: `requester_user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["userTickets"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}