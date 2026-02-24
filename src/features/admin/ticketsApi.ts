import { supabase } from "@/integrations/supabase/client";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  related_rental_id: string | null;
  related_product_id: string | null;
  assigned_to: string | null;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const ticketsTable = () => supabase.from('support_tickets' as any);

export const fetchTickets = async (statusFilter?: string, priorityFilter?: string): Promise<SupportTicket[]> => {
  let query = ticketsTable()
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) query = query.eq('status', statusFilter);
  if (priorityFilter) query = query.eq('priority', priorityFilter);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as unknown as SupportTicket[];
};

export const updateTicketStatus = async (ticketId: string, status: string): Promise<void> => {
  const updates: Record<string, unknown> = { status };
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();

  const { error } = await ticketsTable()
    .update(updates)
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};

export const updateTicketPriority = async (ticketId: string, priority: string): Promise<void> => {
  const { error } = await ticketsTable()
    .update({ priority })
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};

export const updateTicketNotes = async (ticketId: string, adminNotes: string): Promise<void> => {
  const { error } = await ticketsTable()
    .update({ admin_notes: adminNotes })
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};

export const resolveTicket = async (ticketId: string, resolution: string): Promise<void> => {
  const { error } = await ticketsTable()
    .update({
      status: 'resolved',
      resolution,
      resolved_at: new Date().toISOString()
    })
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};

export const assignTicket = async (ticketId: string, adminId: string): Promise<void> => {
  const { error } = await ticketsTable()
    .update({ assigned_to: adminId })
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};

export const deleteTicket = async (ticketId: string): Promise<void> => {
  const { error } = await ticketsTable()
    .delete()
    .eq('id', ticketId);
  if (error) throw new Error(error.message);
};
