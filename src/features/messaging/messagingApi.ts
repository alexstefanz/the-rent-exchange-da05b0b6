import { supabase } from "@/integrations/supabase/client";
import type { AttachmentRow } from "@/lib/chatMedia";

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  rentals_id?: string | null;
  product?: {
    title: string;
    images: string[] | null;
  };
  other_user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: Message | null;
  unread_count?: number;
  rental?: {
    start_date: string;
    end_date: string;
    rental_days: number;
  } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  attachments?: AttachmentRow[];
  message_type?: 'user' | 'system';
}

export async function getOrCreateConversation(productId: string, ownerId: string): Promise<Conversation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if an "organic" (non-rental) conversation exists for this product+buyer
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('product_id', productId)
    .eq('buyer_id', user.id)
    .is('rentals_id', null)
    .maybeSingle();

  if (existing) return existing as Conversation;

  // Create a new organic conversation (rentals_id stays null)
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      product_id: productId,
      buyer_id: user.id,
      owner_id: ownerId,
      rentals_id: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  // Best-effort: insert a system "product inquiry" card so the owner
  // immediately sees which product the new organic conversation is about.
  try {
    const { data: prod } = await supabase
      .from('products')
      .select('title')
      .eq('id', productId)
      .maybeSingle();
    const title = (prod?.title ?? 'Produs').replace(/\|/g, '/');
    await supabase.from('messages').insert({
      conversation_id: (newConv as Conversation).id,
      sender_id: null,
      message_type: 'system',
      content: `product_inquiry|${title}`,
    });
  } catch (e) {
    console.warn('product_inquiry system message insert failed', e);
  }

  return newConv as Conversation;
}

/**
 * Returns (or creates) the dedicated conversation thread tied to a specific rental booking.
 * Each rental gets its own chat thread, even if the renter and owner already chatted before.
 */
export async function getOrCreateRentalConversation(rentalId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_or_create_rental_conversation', {
    p_rental_id: rentalId,
  });

  if (error) {
    console.error('Error creating rental conversation:', error);
    return null;
  }

  return data as string;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Use optimized database function that fetches all data in one query
  const { data, error } = await supabase
    .rpc('get_user_conversations', { user_uuid: user.id });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return (data || []).map(conv => ({
    id: conv.id,
    product_id: conv.product_id,
    buyer_id: conv.buyer_id,
    owner_id: conv.owner_id,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    rentals_id: (conv as any).rentals_id ?? null,
    product: {
      title: conv.product_title,
      images: conv.product_images,
    },
    other_user: {
      full_name: conv.other_user_name,
      avatar_url: conv.other_user_avatar,
    },
    last_message: conv.last_message_content ? {
      id: '', // Not returned from optimized query
      conversation_id: conv.id,
      sender_id: conv.last_message_sender_id,
      content: conv.last_message_content,
      is_read: true, // Not needed for display
      created_at: conv.last_message_created_at,
    } : null,
    unread_count: Number(conv.unread_count) || 0,
    rental: (conv as any).rental_start_date && (conv as any).rental_end_date
      ? {
          start_date: (conv as any).rental_start_date,
          end_date: (conv as any).rental_end_date,
          rental_days: Number((conv as any).rental_days) || 0,
        }
      : null,
  }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as Message[];
}

/** Fetch messages joined with their attachments in a single round-trip. */
export async function getMessagesWithAttachments(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, attachments:message_attachments(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages with attachments:', error);
    return [];
  }
  return (data || []).map((m: any) => ({
    ...m,
    attachments: (m.attachments || []).filter((a: any) => !a.hidden_by_admin),
  })) as Message[];
}

/** Update last_read timestamps via secure RPC. */
export async function markConversationRead(conversationId: string): Promise<void> {
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
}

export interface RentalContextRow {
  id: string;
  public_id: string;
  status: string;
  payment_status: string | null;
  paid_at: string | null;
  handover_confirmed_at: string | null;
  return_confirmed_at: string | null;
  cancelled_at: string | null;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  product_id: string;
  product_title: string | null;
  product_image: string | null;
  product_slug: string | null;
}

export async function getRentalContext(rentalId: string): Promise<RentalContextRow | null> {
  const { data, error } = await supabase
    .from('rentals')
    .select(`
      id, public_id, status, payment_status, paid_at,
      handover_confirmed_at, return_confirmed_at, cancelled_at,
      start_date, end_date, rental_days, subtotal, product_id,
      product:products(title, images, slug)
    `)
    .eq('id', rentalId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching rental context:', error);
    return null;
  }
  const product = (data as any).product;
  return {
    id: data.id,
    public_id: data.public_id,
    status: data.status,
    payment_status: data.payment_status,
    paid_at: data.paid_at,
    handover_confirmed_at: data.handover_confirmed_at,
    return_confirmed_at: data.return_confirmed_at,
    cancelled_at: data.cancelled_at,
    start_date: data.start_date,
    end_date: data.end_date,
    rental_days: data.rental_days,
    subtotal: Number(data.subtotal),
    product_id: data.product_id!,
    product_title: product?.title ?? null,
    product_image: Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null,
    product_slug: product?.slug ?? null,
  };
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_SPECIAL_CHARS = 20;
const SPECIAL_CHAR_RE = /[^\p{L}\p{N}\s.,!?;:\-'"()…–]/gu;

export function countSpecialChars(text: string): number {
  return (text.match(SPECIAL_CHAR_RE) || []).length;
}

/**
 * Returns the input clamped so that it does not exceed MAX_MESSAGE_LENGTH
 * total characters AND no more than MAX_SPECIAL_CHARS special characters.
 * When the special-char cap is reached, further special characters are
 * silently dropped from the new input, but regular characters still go through.
 * Returns { value, blockedSpecial } so the UI can show feedback.
 */
const IS_SPECIAL_CHAR = /[^\p{L}\p{N}\s.,!?;:\-'"()…–]/u;
export function clampChatInput(next: string): { value: string; blockedSpecial: boolean } {
  const capped = next.slice(0, MAX_MESSAGE_LENGTH);
  if (countSpecialChars(capped) <= MAX_SPECIAL_CHARS) {
    return { value: capped, blockedSpecial: false };
  }
  let kept = 0;
  let out = "";
  for (const ch of capped) {
    if (IS_SPECIAL_CHAR.test(ch)) {
      if (kept >= MAX_SPECIAL_CHARS) continue;
      kept++;
    }
    out += ch;
  }
  return { value: out, blockedSpecial: true };
}

export async function sendMessage(conversationId: string, content: string): Promise<Message | null> {
  const trimmed = content.trim();
  
  // Validate message content length
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
    console.error('Invalid message length: must be between 1 and', MAX_MESSAGE_LENGTH, 'characters');
    return null;
  }

  if (countSpecialChars(trimmed) > MAX_SPECIAL_CHARS) {
    console.error('Too many special characters: max', MAX_SPECIAL_CHARS);
    throw new Error('TOO_MANY_SPECIAL_CHARS');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    if ((error.message || '').includes('PROFANITY_BLOCKED')) {
      throw new Error('PROFANITY_BLOCKED');
    }
    if ((error.message || '').includes('CONTACT_INFO_BLOCKED')) {
      throw new Error('CONTACT_INFO_BLOCKED');
    }
    return null;
  }

  // Fire-and-forget: don't block the UI on conversation timestamp update
  void supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .then(({ error: updErr }) => {
      if (updErr) console.error('conversation updated_at error:', updErr);
    });

  // Fire-and-forget: don't block the UI on email notification
  void supabase.functions
    .invoke('send-message-notification', {
      body: {
        conversation_id: conversationId,
        sender_id: user.id,
        message_content: trimmed,
      },
    })
    .catch((e) => console.error('Message notification error:', e));

  return data as Message;
}

export { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS };

export async function markMessagesAsRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);
}

export async function getOwnerContactInfo(ownerId: string) {
  // Use secure database function that only returns contact info if user has a conversation with the owner
  const { data, error } = await supabase
    .rpc('get_contact_info_if_in_conversation', { owner_uuid: ownerId });

  if (error) {
    console.error('Error fetching owner info:', error);
    return null;
  }

  // Function returns an array, get first result or null
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Unified "payment effective" check shared by chat surfaces (header, info panel,
 * input alert). Matches what `get_contact_info_if_in_conversation` accepts so
 * UI gating and backend gating stay in sync.
 */
export function isRentalPaidLike(
  paymentStatus?: string | null,
  paidAt?: string | null,
): boolean {
  if (paidAt) return true;
  return ["authorized", "paid", "captured", "partially_refunded"].includes(
    (paymentStatus || "").toLowerCase(),
  );
}

/** @deprecated No longer injected after payment. Chat stays organic (Vinted/OLX style). */
export interface RentalContext {
  productTitle: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalPrice: number;
}

/**
 * @deprecated No longer used. The post-payment auto-message felt robotic;
 * chat now stays organic — users write their own messages before/after booking.
 * Kept exported only to avoid breaking older imports.
 */
export async function ensureRentalContextMessage(
  conversationId: string,
  ctx: RentalContext,
): Promise<void> {
  const { data: existing, error: checkError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .limit(1);

  if (checkError) {
    console.error('Error checking existing messages:', checkError);
    return;
  }
  if (existing && existing.length > 0) return; // already has messages, do nothing

  const content =
    `Bună! Tocmai am rezervat „${ctx.productTitle}" pentru perioada ` +
    `${ctx.startDate} – ${ctx.endDate} (${ctx.rentalDays} ${ctx.rentalDays === 1 ? 'zi' : 'zile'}, ` +
    `total ${ctx.totalPrice} RON). Aștept confirmarea ta. Mulțumesc!`;

  await sendMessage(conversationId, content);
}
