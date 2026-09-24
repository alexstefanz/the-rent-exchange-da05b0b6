import { supabase } from "@/integrations/supabase/client";
import type { OpsTicket, OpsTicketMessage as BaseOpsTicketMessage, CreateOpsTicketInput } from "@/features/admin/opsTicketsApi";
import { CATEGORY_GROUPS, CATEGORY_TYPES, CATEGORY_GROUP_LABELS } from "@/features/admin/opsTicketsApi";
import {
  ticketValidationMessage,
  validateTicketContent,
  validateTicketReply,
} from "@/features/tickets/ticketValidation";

export { CATEGORY_GROUPS, CATEGORY_TYPES, CATEGORY_GROUP_LABELS };
export type { OpsTicket };
export type OpsTicketMessage = BaseOpsTicketMessage & { read_at?: string | null };

// Helper to bypass type checking for tables not fully in generated types
const opsTickets = () => supabase.from('ops_tickets' as any);
const opsMessages = () => supabase.from('ops_ticket_messages' as any);
const opsAttachments = () => supabase.from('ops_ticket_attachments' as any);

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
  const validationError = validateTicketContent(input.title, input.description);
  if (validationError) throw new Error(ticketValidationMessage(validationError));

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
  if (error) throw new Error(mapTicketError(error.message));
  return data as unknown as OpsTicket;
};

/**
 * Map server-side antispam errors (raised by the `enforce_ticket_antispam` trigger)
 * to friendly Romanian messages shown in toasts.
 */
function mapTicketError(message: string): string {
  const m = message || "";
  if (m.includes("TICKET_PROFANITY_BLOCKED")) return ticketValidationMessage("PROFANITY");
  if (m.includes("TICKET_TITLE_TOO_SHORT")) return ticketValidationMessage("TITLE_TOO_SHORT");
  if (m.includes("TICKET_TITLE_TOO_LONG")) return ticketValidationMessage("TITLE_TOO_LONG");
  if (m.includes("TICKET_DESCRIPTION_TOO_SHORT")) return ticketValidationMessage("DESCRIPTION_TOO_SHORT");
  if (m.includes("TICKET_DESCRIPTION_TOO_LONG")) return ticketValidationMessage("DESCRIPTION_TOO_LONG");
  if (m.includes("TICKET_REPLY_TOO_SHORT")) return ticketValidationMessage("REPLY_TOO_SHORT");
  if (m.includes("TICKET_REPLY_TOO_LONG")) return ticketValidationMessage("REPLY_TOO_LONG");
  if (m.includes("TICKET_REPLY_RATE_LIMIT")) return "Ai trimis prea multe răspunsuri într-un timp scurt. Așteaptă un minut și încearcă din nou.";
  if (m.includes("TICKET_REPLY_DUPLICATE")) return "Acest răspuns a fost deja trimis. Completează informațiile într-un singur răspuns.";
  const match = m.match(/ANTISPAM_([A-Z_]+):(\d+)/);
  if (!match) return m;
  const code = match[1];
  const value = parseInt(match[2], 10);
  switch (code) {
    case "COOLDOWN":
      return `Vă rugăm să așteptați încă ${value} secunde înainte de a deschide un alt tichet.`;
    case "HOURLY":
      return `Ați atins limita de ${value} tichete pe oră. Reveniți mai târziu.`;
    case "DAILY":
      return value === 1
        ? `Puteți deschide doar 1 tichet la 24 de ore. Reveniți mâine sau continuați conversația în tichetul existent.`
        : `Ai atins limita de ${value} tichete pe zi. Încearcă din nou mâine sau răspunde într-un tichet existent.`;
    case "OPEN_LIMIT":
      return `Aveți deja ${value} tichete deschise. Închideți sau așteptați rezolvarea celor existente înainte de a deschide unul nou.`;
    case "DUPLICATE":
      return `Ați deschis recent un tichet cu același titlu. Așteptați ${value} minute sau continuați conversația în tichetul existent.`;
    default:
      return m;
  }
}

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
  const isAttachment = isTicketAttachmentRef(messageText) || messageText.startsWith("support-attachments://");
  if (!isAttachment) {
    const validationError = validateTicketReply(messageText);
    if (validationError) throw new Error(ticketValidationMessage(validationError));
  }

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

  if (error) throw new Error(mapTicketError(error.message));
  return data as unknown as OpsTicketMessage;
};

/**
 * Mark all non-customer (admin/system) messages on a ticket as read by the current user.
 * RPC enforces ownership server-side.
 */
export const markUserTicketRead = async (ticketId: string): Promise<void> => {
  const { error } = await supabase.rpc('mark_ticket_messages_read' as any, { p_ticket_id: ticketId });
  if (error) console.warn('[mark_ticket_messages_read]', error.message);
};

/**
 * Upload an image attachment to the user's ticket.
 * Stored at <ticket_id>/<timestamp>-<rand>.jpg in the private `ticket-attachments` bucket.
 * Inserts a CUSTOMER message with the storage reference and links it to ops_ticket_attachments.
 */
const TICKET_BUCKET = "ticket-attachments";
const TICKET_PATH_PREFIX = "ticket-attachments://";

export const addUserTicketAttachment = async (
  ticketId: string,
  file: File
): Promise<OpsTicketMessage> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const ext = (file.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
  const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(TICKET_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600" });
  if (upErr) throw new Error(upErr.message);

  const reference = `${TICKET_PATH_PREFIX}${path}`;

  const { data: msg, error: msgErr } = await opsMessages()
    .insert({
      ticket_id: ticketId,
      author_type: 'CUSTOMER',
      author_id: userData.user.id,
      message_text: reference,
      is_internal: false,
    })
    .select()
    .single();
  if (msgErr) throw new Error(msgErr.message);

  // Best-effort row in attachments table for admin visibility
  await opsAttachments()
    .insert({
      ticket_id: ticketId,
      message_id: (msg as any).id,
      file_url: reference,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by_type: 'CUSTOMER',
      uploaded_by_id: userData.user.id,
    });

  return msg as unknown as OpsTicketMessage;
};

/**
 * Resolve a stored ticket attachment reference to a short-lived signed URL.
 * Accepts both `ticket-attachments://<path>` and raw paths.
 */
export const getTicketAttachmentSignedUrl = async (reference: string): Promise<string | null> => {
  const path = reference.startsWith(TICKET_PATH_PREFIX)
    ? reference.slice(TICKET_PATH_PREFIX.length)
    : reference;
  const { data, error } = await supabase.storage
    .from(TICKET_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
};

export const isTicketAttachmentRef = (text: string): boolean =>
  text.trim().startsWith(TICKET_PATH_PREFIX);

/**
 * Close own ticket (sets status to CLOSED). RPC enforces ownership server-side.
 */
export const closeUserTicket = async (ticketId: string): Promise<void> => {
  const { error } = await supabase.rpc('close_user_ticket' as any, { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
};
