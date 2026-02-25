import { useQuery } from "@tanstack/react-query";
import {
  fetchOpsTickets,
  fetchOpsTicket,
  fetchTicketMessages,
  fetchTicketAuditLog,
  fetchTicketAttachments,
  type FetchTicketsFilters,
} from "@/features/admin/opsTicketsApi";

export const useOpsTickets = (filters?: FetchTicketsFilters) => {
  return useQuery({
    queryKey: ['opsTickets', filters],
    queryFn: () => fetchOpsTickets(filters),
    staleTime: 30000,
  });
};

export const useOpsTicket = (id: string | undefined) => {
  return useQuery({
    queryKey: ['opsTicket', id],
    queryFn: () => fetchOpsTicket(id!),
    enabled: !!id,
  });
};

export const useTicketMessages = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: () => fetchTicketMessages(ticketId!),
    enabled: !!ticketId,
    refetchInterval: 15000,
  });
};

export const useTicketAuditLog = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticketAuditLog', ticketId],
    queryFn: () => fetchTicketAuditLog(ticketId!),
    enabled: !!ticketId,
  });
};

export const useTicketAttachments = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['ticketAttachments', ticketId],
    queryFn: () => fetchTicketAttachments(ticketId!),
    enabled: !!ticketId,
  });
};
