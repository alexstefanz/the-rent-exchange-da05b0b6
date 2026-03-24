
-- ============================================================
-- 1. INDEXES for conversations, messages, favorites
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read ON public.messages (conversation_id, is_read, sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations (owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_products_user_id ON public.favorite_products (user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_users_user_id ON public.favorite_users (user_id);

-- ============================================================
-- 2. FUNCTION: get_owner_rentals (replaces 3 queries)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_owner_rentals(owner_uuid uuid)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  renter_id uuid,
  start_date date,
  end_date date,
  rental_days integer,
  daily_price numeric,
  subtotal numeric,
  platform_fee numeric,
  owner_payout numeric,
  status text,
  payment_status text,
  payment_method text,
  created_at timestamptz,
  product_title text,
  product_image text,
  renter_name text,
  renter_avatar text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.product_id,
    r.renter_id,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.daily_price,
    r.subtotal,
    r.platform_fee,
    r.owner_payout,
    r.status,
    r.payment_status,
    r.payment_method,
    r.created_at,
    COALESCE(p.title, 'Produs') as product_title,
    p.images[1] as product_image,
    renter.full_name as renter_name,
    renter.avatar_url as renter_avatar
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  WHERE r.owner_id = owner_uuid
  ORDER BY r.created_at DESC;
$$;

-- ============================================================
-- 3. FUNCTION: get_rental_details (replaces 4 queries)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_rental_details(rental_uuid uuid)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  renter_id uuid,
  owner_id uuid,
  start_date date,
  end_date date,
  rental_days integer,
  subtotal numeric,
  owner_payout numeric,
  status text,
  payment_status text,
  product_title text,
  product_images text[],
  renter_name text,
  owner_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.product_id,
    r.renter_id,
    r.owner_id,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.owner_payout,
    r.status,
    r.payment_status,
    COALESCE(p.title, 'Produs') as product_title,
    p.images as product_images,
    renter.full_name as renter_name,
    owner_prof.full_name as owner_name
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  LEFT JOIN profiles owner_prof ON owner_prof.id = r.owner_id
  WHERE r.id = rental_uuid
    AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'));
$$;

-- ============================================================
-- 4. FUNCTION: get_admin_conversations_list (replaces 4 queries)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_conversations_list(search_text text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  buyer_id uuid,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  product_title text,
  product_images text[],
  buyer_name text,
  buyer_avatar text,
  owner_name text,
  owner_avatar text,
  last_message_content text,
  last_message_created_at timestamptz,
  message_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.product_id,
    c.buyer_id,
    c.owner_id,
    c.created_at,
    c.updated_at,
    COALESCE(p.title, 'Produs șters') as product_title,
    p.images as product_images,
    buyer.full_name as buyer_name,
    buyer.avatar_url as buyer_avatar,
    owner_prof.full_name as owner_name,
    owner_prof.avatar_url as owner_avatar,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    COALESCE(mc.cnt, 0) as message_count
  FROM conversations c
  LEFT JOIN products p ON p.id = c.product_id
  LEFT JOIN profiles buyer ON buyer.id = c.buyer_id
  LEFT JOIN profiles owner_prof ON owner_prof.id = c.owner_id
  LEFT JOIN LATERAL (
    SELECT m.content, m.created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt
    FROM messages m
    WHERE m.conversation_id = c.id
  ) mc ON true
  WHERE has_role(auth.uid(), 'admin')
    AND (
      search_text IS NULL
      OR p.title ILIKE '%' || search_text || '%'
      OR buyer.full_name ILIKE '%' || search_text || '%'
      OR owner_prof.full_name ILIKE '%' || search_text || '%'
    )
  ORDER BY c.updated_at DESC
  LIMIT 200;
$$;
