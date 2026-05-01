import { supabase } from "@/integrations/supabase/client";

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
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
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

const MAX_MESSAGE_LENGTH = 5000;

export async function sendMessage(conversationId: string, content: string): Promise<Message | null> {
  const trimmed = content.trim();
  
  // Validate message content length
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
    console.error('Invalid message length: must be between 1 and', MAX_MESSAGE_LENGTH, 'characters');
    return null;
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
    return null;
  }

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Send email notification (non-blocking)
  try {
    await supabase.functions.invoke('send-message-notification', {
      body: {
        conversation_id: conversationId,
        sender_id: user.id,
        message_content: trimmed,
      },
    });
  } catch (e) {
    console.error('Message notification error:', e);
  }

  return data as Message;
}

export { MAX_MESSAGE_LENGTH };

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
