import { supabase } from "@/integrations/supabase/client";

export interface AdminConversation {
  id: string;
  product_id: string;
  buyer_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  product_title: string;
  product_images: string[] | null;
  buyer_name: string | null;
  buyer_avatar: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  message_count: number;
}

export async function getAdminConversations(search?: string): Promise<AdminConversation[]> {
  const { data, error } = await supabase.rpc("get_admin_conversations_list", {
    search_text: search || null,
  });

  if (error) {
    console.error("Error fetching admin conversations:", error);
    return [];
  }

  return ((data || []) as any[]).map((c) => ({
    id: c.id,
    product_id: c.product_id,
    buyer_id: c.buyer_id,
    owner_id: c.owner_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    product_title: c.product_title,
    product_images: c.product_images,
    buyer_name: c.buyer_name,
    buyer_avatar: c.buyer_avatar,
    owner_name: c.owner_name,
    owner_avatar: c.owner_avatar,
    last_message_content: c.last_message_content,
    last_message_created_at: c.last_message_created_at,
    message_count: Number(c.message_count),
  }));
}

export async function getAdminConversationDetail(conversationId: string) {
  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !conv) return null;

  const [productRes, buyerRes, ownerRes, messagesRes] = await Promise.all([
    supabase.from('products').select('id, title, images, slug').eq('id', conv.product_id).single(),
    supabase.from('profiles').select('id, full_name, avatar_url, email').eq('id', conv.buyer_id).single(),
    supabase.from('profiles').select('id, full_name, avatar_url, email').eq('id', conv.owner_id).single(),
    supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
  ]);

  return {
    conversation: conv,
    product: productRes.data,
    buyer: buyerRes.data,
    owner: ownerRes.data,
    messages: messagesRes.data || [],
  };
}

export async function findConversationBetweenUsers(buyerId: string, ownerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(buyer_id.eq.${buyerId},owner_id.eq.${ownerId}),and(buyer_id.eq.${ownerId},owner_id.eq.${buyerId})`)
    .limit(1)
    .maybeSingle();

  return data?.id || null;
}
