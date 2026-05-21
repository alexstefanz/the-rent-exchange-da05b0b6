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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_ticket_attachments", filter: `ticket_id=eq.${ticketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["userTicketMessages", ticketId] });
          qc.invalidateQueries({ queryKey: ["supportChatMessages", ticketId] });
          qc.invalidateQueries({ queryKey: ["ticketMessages", ticketId] });
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

/**
 * Admin-side realtime: listens to all ops_tickets and ops_ticket_messages changes
 * and refreshes the inbox / open ticket caches.
 */
export function useAdminTicketsRealtime(activeTicketId?: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("admin-tickets-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tickets" },
        () => {
          qc.invalidateQueries({ queryKey: ["opsTickets"] });
          if (activeTicketId) qc.invalidateQueries({ queryKey: ["opsTicket", activeTicketId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ops_ticket_messages" },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["opsTickets"] });
          const tid = payload?.new?.ticket_id;
          if (tid) {
            qc.invalidateQueries({ queryKey: ["ticketMessages", tid] });
            qc.invalidateQueries({ queryKey: ["opsTicket", tid] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, activeTicketId]);
}