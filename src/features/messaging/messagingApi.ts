import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
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

  // Check if conversation exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('product_id', productId)
    .eq('buyer_id', user.id)
    .single();

  if (existing) return existing as Conversation;

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      product_id: productId,
      buyer_id: user.id,
      owner_id: ownerId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return newConv as Conversation;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      product:products(title, images)
    `)
    .or(`buyer_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Get last message and unread count for each conversation
  const conversationsWithDetails = await Promise.all(
    (data || []).map(async (conv) => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      // Get other user info
      const otherUserId = conv.buyer_id === user.id ? conv.owner_id : conv.buyer_id;
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      return {
        ...conv,
        last_message: messages?.[0] || null,
        unread_count: count || 0,
        other_user: otherUser
      } as Conversation;
    })
  );

  return conversationsWithDetails;
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

export async function sendMessage(conversationId: string, content: string): Promise<Message | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
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

  return data as Message;
}

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
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone, email, whatsapp, avatar_url')
    .eq('id', ownerId)
    .single();

  if (error) {
    console.error('Error fetching owner info:', error);
    return null;
  }

  return data;
}
