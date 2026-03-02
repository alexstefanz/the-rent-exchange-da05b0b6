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
  // Fetch conversations with joined data
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id, product_id, buyer_id, owner_id, created_at, updated_at
    `)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching admin conversations:', error);
    return [];
  }

  if (!conversations || conversations.length === 0) return [];

  // Get unique user IDs and product IDs
  const userIds = [...new Set(conversations.flatMap(c => [c.buyer_id, c.owner_id]))];
  const productIds = [...new Set(conversations.map(c => c.product_id))];

  // Fetch profiles, products, and last messages in parallel
  const [profilesRes, productsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
    supabase.from('products').select('id, title, images').in('id', productIds),
  ]);

  const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
  const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));

  // Get last message and count per conversation
  const convIds = conversations.map(c => c.id);
  const { data: messagesData } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  const lastMessageMap = new Map<string, { content: string; created_at: string }>();
  const messageCountMap = new Map<string, number>();
  
  (messagesData || []).forEach(m => {
    messageCountMap.set(m.conversation_id, (messageCountMap.get(m.conversation_id) || 0) + 1);
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, { content: m.content, created_at: m.created_at });
    }
  });

  let result: AdminConversation[] = conversations.map(c => {
    const buyer = profilesMap.get(c.buyer_id);
    const owner = profilesMap.get(c.owner_id);
    const product = productsMap.get(c.product_id);
    const lastMsg = lastMessageMap.get(c.id);

    return {
      id: c.id,
      product_id: c.product_id,
      buyer_id: c.buyer_id,
      owner_id: c.owner_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      product_title: product?.title || 'Produs șters',
      product_images: product?.images || null,
      buyer_name: buyer?.full_name || null,
      buyer_avatar: buyer?.avatar_url || null,
      owner_name: owner?.full_name || null,
      owner_avatar: owner?.avatar_url || null,
      last_message_content: lastMsg?.content || null,
      last_message_created_at: lastMsg?.created_at || null,
      message_count: messageCountMap.get(c.id) || 0,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.product_title.toLowerCase().includes(q) ||
      c.buyer_name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q)
    );
  }

  return result;
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
