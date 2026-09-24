import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

export interface OpsTicket {
  id: string;
  public_id: string;
  title: string;
  description: string;
  category_group: string;
  category_type: string;
  priority: string;
  status: string;
  created_by: string | null;
  assigned_to: string | null;
  requester_user_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  rental_user_id: string | null;
  owner_user_id: string | null;
  reservation_id: string | null;
  product_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  last_admin_read_at: string | null;
  first_response_at?: string | null;
  sla_due_at?: string | null;
  sla_breached_at?: string | null;
  created_via?: string | null;
}

export interface OpsTicketMessage {
  id: string;
  ticket_id: string;
  author_type: string;
  author_id: string | null;
  message_text: string;
  is_internal: boolean;
  created_at: string;
  author_name?: string | null;
}

export interface OpsTicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by_type: string | null;
  uploaded_by_id: string | null;
  created_at: string;
}

export interface OpsTicketAuditEntry {
  id: string;
  ticket_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface CreateOpsTicketInput {
  title: string;
  description: string;
  category_group: string;
  category_type: string;
  priority?: string;
  reservation_id?: string | null;
  product_id?: string | null;
  requester_user_id?: string | null;
  rental_user_id?: string | null;
  owner_user_id?: string | null;
  tags?: string[];
}

// Helper to bypass type checking for new tables not in generated types
const opsTickets = () => supabase.from('ops_tickets' as any);

// Mark a ticket as read by the current admin
export const markTicketRead = async (ticketId: string): Promise<void> => {
  const { error } = await supabase.rpc('mark_ops_ticket_read' as any, { p_ticket_id: ticketId });
  if (error) throw error;
};
const opsMessages = () => supabase.from('ops_ticket_messages' as any);
const opsAttachments = () => supabase.from('ops_ticket_attachments' as any);
const opsAuditLog = () => supabase.from('ops_ticket_audit_log' as any);

// ============================================
// Category type mappings
// ============================================

export const CATEGORY_GROUPS = ['RESERVATION', 'PRODUCT', 'FINANCIAL', 'DISPUTE', 'USER'] as const;

export const CATEGORY_TYPES: Record<string, { value: string; label: string }[]> = {
  RESERVATION: [
    { value: 'OWNER_CANT_FULFILL', label: 'Owner nu poate onora' },
    { value: 'LATE_HANDOVER', label: 'Întârziere predare' },
    { value: 'NO_SHOW', label: 'Nu se prezintă' },
    { value: 'RESERVATION_CHANGE', label: 'Modificare rezervare' },
    { value: 'CANCELLATION_ISSUE', label: 'Anulare problematică' },
  ],
  PRODUCT: [
    { value: 'DEFECTIVE', label: 'Produs defect' },
    { value: 'DAMAGED_ON_RETURN', label: 'Deteriorat la returnare' },
    { value: 'MISSING_PARTS', label: 'Piese lipsă' },
    { value: 'NOT_AS_DESCRIBED', label: 'Nu corespunde descrierii' },
  ],
  FINANCIAL: [
    { value: 'PAYMENT_ISSUE', label: 'Problemă plată' },
    { value: 'REFUND_REQUEST', label: 'Cerere refund' },
    { value: 'REFUND_DISPUTE', label: 'Dispută refund' },
    { value: 'CHARGEBACK', label: 'Chargeback' },
    { value: 'PENALTY', label: 'Penalizare' },
  ],
  DISPUTE: [
    { value: 'OWNER_VS_RENTER', label: 'Conflict owner-chiriaș' },
    { value: 'DAMAGE_LIABILITY', label: 'Responsabilitate daune' },
    { value: 'DEPOSIT_DISPUTE', label: 'Dispută garanție' },
  ],
  USER: [
    { value: 'FRAUD_SUSPECTED', label: 'Suspiciune fraudă' },
    { value: 'ABUSIVE_BEHAVIOR', label: 'Comportament abuziv' },
    { value: 'GENERAL_INQUIRY', label: 'Întrebare generală' },
  ],
};

export const CATEGORY_GROUP_LABELS: Record<string, string> = {
  RESERVATION: 'Rezervare',
  PRODUCT: 'Produs',
  FINANCIAL: 'Financiar',
  DISPUTE: 'Dispută',
  USER: 'Utilizator',
};

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Scăzut' },
  { value: 'MEDIUM', label: 'Mediu' },
  { value: 'HIGH', label: 'Ridicat' },
  { value: 'URGENT', label: 'Urgent' },
];

export const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'IN_PROGRESS', label: 'În lucru' },
  { value: 'WAITING_CUSTOMER', label: 'Așteptare client' },
  { value: 'WAITING_OWNER', label: 'Așteptare owner' },
  { value: 'WAITING_INTERNAL', label: 'Așteptare internă' },
  { value: 'RESOLVED', label: 'Rezolvat' },
  { value: 'CLOSED', label: 'Închis' },
];

// ============================================
// Tickets CRUD
// ============================================

export interface FetchTicketsFilters {
  status?: string;
  priority?: string;
  category_group?: string;
  category_type?: string;
  search?: string;
  created_via?: string;
}

export const fetchOpsTickets = async (filters?: FetchTicketsFilters): Promise<OpsTicket[]> => {
  let query = opsTickets().select('*').order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.category_group) query = query.eq('category_group', filters.category_group);
  if (filters?.category_type) query = query.eq('category_type', filters.category_type);
  if (filters?.created_via) query = query.eq('created_via', filters.created_via);
  if (filters?.search) {
    const term = filters.search.trim();
    // Look up requester ids matching the search term in profiles (name/email)
    let requesterIds: string[] = [];
    if (term && !/^TCK[-\s]?\d/i.test(term)) {
      const { data: matchedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(50);
      requesterIds = (matchedProfiles || []).map((p: any) => p.id);
    }
    const orParts = [
      `public_id.ilike.%${term}%`,
      `title.ilike.%${term}%`,
    ];
    if (requesterIds.length > 0) {
      orParts.push(`requester_user_id.in.(${requesterIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const tickets = (data || []) as unknown as OpsTicket[];

  // Batch-enrich with requester name/email
  const ids = Array.from(
    new Set(tickets.map((t) => t.requester_user_id).filter((x): x is string => !!x))
  );
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids);
    const map = new Map((profiles || []).map((p: any) => [p.id, p]));
    tickets.forEach((t) => {
      if (t.requester_user_id) {
        const p = map.get(t.requester_user_id);
        if (p) {
          t.requester_name = p.full_name;
          t.requester_email = p.email;
        }
      }
    });
  }
  return tickets;
};

export const fetchOpsTicket = async (id: string): Promise<OpsTicket> => {
  const { data, error } = await opsTickets().select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  const ticket = data as unknown as OpsTicket;

  // Fetch requester profile if available
  if (ticket.requester_user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', ticket.requester_user_id)
      .single();
    if (profile) {
      ticket.requester_name = profile.full_name;
      ticket.requester_email = profile.email;
    }
  }

  return ticket;
};

export const createOpsTicket = async (input: CreateOpsTicketInput): Promise<OpsTicket> => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const insertData: Record<string, unknown> = {
    ...input,
    created_by: userId,
    priority: input.priority || 'MEDIUM',
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
      insertData.rental_user_id = insertData.rental_user_id || rental.renter_id;
      insertData.owner_user_id = insertData.owner_user_id || rental.owner_id;
    }
  }

  const { data, error } = await opsTickets().insert(insertData).select().single();
  if (error) throw new Error(error.message);

  // Audit log
  await opsAuditLog().insert({
    ticket_id: (data as any).id,
    action: 'TICKET_CREATED',
    new_value: input.title,
    actor_id: userId,
  });

  // Notify requester via email (non-blocking)
  const ticketAny = data as any;
  if (ticketAny.requester_user_id) {
    sendTicketEmail(
      ticketAny.requester_user_id,
      'ticket-created',
      `ticket-created-${ticketAny.id}`,
      { ticketId: ticketAny.public_id, ticketTitle: ticketAny.title }
    );
  }

  return data as unknown as OpsTicket;
};

export const updateOpsTicketField = async (
  ticketId: string,
  field: string,
  oldValue: string | null,
  newValue: string,
  auditAction: string
): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  const updates: Record<string, unknown> = { [field]: newValue };
  if (field === 'status' && newValue === 'CLOSED') {
    updates.closed_at = new Date().toISOString();
  }

  const { error } = await opsTickets().update(updates).eq('id', ticketId);
  if (error) throw new Error(error.message);

  await opsAuditLog().insert({
    ticket_id: ticketId,
    action: auditAction,
    old_value: oldValue,
    new_value: newValue,
    actor_id: userData.user?.id,
  });

  // If admin closed/resolved the ticket, send email
  if (field === 'status' && (newValue === 'CLOSED' || newValue === 'RESOLVED')) {
    try {
      const { data: t } = await opsTickets().select('requester_user_id, public_id').eq('id', ticketId).single();
      const tAny = t as any;
      if (tAny?.requester_user_id) {
        sendTicketEmail(tAny.requester_user_id, 'ticket-resolved', `ticket-resolved-${ticketId}-${newValue}`, { ticketId: tAny.public_id });
      }
    } catch (e) { console.error('[opsTicketsApi] resolved email failed:', e); }
  }
};

// ============================================
// Messages
// ============================================

export const fetchTicketMessages = async (ticketId: string): Promise<OpsTicketMessage[]> => {
  const { data, error } = await opsMessages()
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const messages = (data || []) as unknown as OpsTicketMessage[];

  // Enrich with author names from profiles
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

export const createTicketMessage = async (
  ticketId: string,
  messageText: string,
  isInternal: boolean = false,
  authorType: string = 'ADMIN'
): Promise<OpsTicketMessage> => {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await opsMessages()
    .insert({
      ticket_id: ticketId,
      author_type: authorType,
      author_id: userData.user?.id,
      message_text: messageText,
      is_internal: isInternal,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Audit
  await opsAuditLog().insert({
    ticket_id: ticketId,
    action: isInternal ? 'INTERNAL_NOTE_ADDED' : 'MESSAGE_ADDED',
    new_value: messageText.substring(0, 100),
    actor_id: userData.user?.id,
  });

  // If admin replied publicly, email the requester — only for the FIRST
  // public admin reply on the ticket (one reply email per ticket).
  if (!isInternal && authorType === 'ADMIN') {
    try {
      const { count } = await opsMessages()
        .select('id', { count: 'exact', head: true })
        .eq('ticket_id', ticketId)
        .eq('author_type', 'ADMIN')
        .eq('is_internal', false)
        .neq('id', (data as any).id);
      if ((count ?? 0) === 0) {
        const { data: t } = await opsTickets().select('requester_user_id, public_id').eq('id', ticketId).single();
        const tAny = t as any;
        if (tAny?.requester_user_id) {
          sendTicketEmail(
            tAny.requester_user_id,
            'ticket-replied',
            `ticket-replied-${ticketId}`,
            { ticketId: tAny.public_id, messagePreview: messageText.substring(0, 200) }
          );
        }
      }
    } catch (e) { console.error('[opsTicketsApi] replied email failed:', e); }
  }

  return data as unknown as OpsTicketMessage;
};

// Helper: send ticket-related email to user (non-blocking)
async function sendTicketEmail(
  userId: string,
  templateName: string,
  idempotencyKey: string,
  extraData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    if (!profile?.email) return;
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName,
        recipientEmail: profile.email,
        idempotencyKey,
        templateData: { name: profile.full_name || undefined, ...extraData },
      },
    });
  } catch (e) {
    console.error(`[opsTicketsApi] Failed to send ${templateName} email:`, e);
  }
}

// ============================================
// Attachments
// ============================================

export const fetchTicketAttachments = async (ticketId: string): Promise<OpsTicketAttachment[]> => {
  const { data, error } = await opsAttachments()
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as OpsTicketAttachment[];
};

export const uploadTicketAttachment = async (
  ticketId: string,
  file: File,
  messageId?: string
): Promise<OpsTicketAttachment> => {
  const { data: userData } = await supabase.auth.getUser();
  const filePath = `${ticketId}/${Date.now()}_${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from('ticket-attachments')
    .upload(filePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(filePath);

  const { data, error } = await opsAttachments()
    .insert({
      ticket_id: ticketId,
      message_id: messageId || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by_type: 'ADMIN',
      uploaded_by_id: userData.user?.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as OpsTicketAttachment;
};

// ============================================
// Audit Log
// ============================================

export const fetchTicketAuditLog = async (ticketId: string): Promise<OpsTicketAuditEntry[]> => {
  const { data, error } = await opsAuditLog()
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as OpsTicketAuditEntry[];
};
