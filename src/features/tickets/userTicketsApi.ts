import { supabase } from "@/integrations/supabase/client";
import type { OpsTicket, OpsTicketMessage, CreateOpsTicketInput } from "@/features/admin/opsTicketsApi";
import { CATEGORY_GROUPS, CATEGORY_TYPES, CATEGORY_GROUP_LABELS } from "@/features/admin/opsTicketsApi";

export { CATEGORY_GROUPS, CATEGORY_TYPES, CATEGORY_GROUP_LABELS };
export type { OpsTicket, OpsTicketMessage };

// Helper to bypass type checking for tables not fully in generated types
const opsTickets = () => supabase.from('ops_tickets' as any);
const opsMessages = () => supabase.from('ops_ticket_messages' as any);

/**
 * Fetch tickets for the current authenticated user
 */
export const fetchUserTickets = async (): Promise<OpsTicket[]> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await opsTickets()
    .select('*')
    .eq('requester_user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as OpsTicket[];
};

/**
 * Create a ticket as a regular user
 */
export const createUserTicket = async (input: {
  title: string;
  description: string;
  category_group: string;
  category_type: string;
  reservation_id?: string | null;
  product_id?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}): Promise<OpsTicket> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const insertData: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    category_group: input.category_group,
    category_type: input.category_type,
    priority: input.priority || 'MEDIUM',
    requester_user_id: userData.user.id,
    reservation_id: input.reservation_id || null,
    product_id: input.product_id || null,
  };

  // Auto-populate context from reservation if provided
  if (input.reservation_id) {
    const { data: rental } = await supabase
      .from('rentals')
      .select('product_id, renter_id, owner_id')
      .eq('id', input.reservation_id)
      .single();
    if (rental) {
      insertData.product_id = insertData.product_id || rental.product_id;
      insertData.rental_user_id = rental.renter_id;
      insertData.owner_user_id = rental.owner_id;
    }
  }

  const { data, error } = await opsTickets().insert(insertData).select().single();
  if (error) throw new Error(error.message);
  return data as unknown as OpsTicket;
};

/**
 * Fetch non-internal messages for a ticket (RLS ensures only own tickets)
 */
export const fetchUserTicketMessages = async (ticketId: string): Promise<OpsTicketMessage[]> => {
  const { data, error } = await opsMessages()
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  const messages = (data || []) as unknown as OpsTicketMessage[];

  // Enrich with author names so the user sees who from support replied
  const authorIds = Array.from(
    new Set(messages.map(m => m.author_id).filter((id): id is string => !!id))
  );
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);
    const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
    messages.forEach(m => {
      m.author_name = m.author_id ? nameMap.get(m.author_id) ?? null : null;
    });
  }
  return messages;
};

/**
 * Add a message to own ticket as CUSTOMER
 */
export const addUserTicketMessage = async (
  ticketId: string,
  messageText: string
): Promise<OpsTicketMessage> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await opsMessages()
    .insert({
      ticket_id: ticketId,
      author_type: 'CUSTOMER',
      author_id: userData.user.id,
      message_text: messageText,
      is_internal: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as OpsTicketMessage;
};
