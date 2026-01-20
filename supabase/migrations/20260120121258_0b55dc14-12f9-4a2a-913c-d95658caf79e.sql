-- =====================================================
-- PHASE 1: DATABASE INDEXES
-- =====================================================

-- Products table indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_location_city ON products(location_city);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(is_active, category);
CREATE INDEX IF NOT EXISTS idx_products_active_owner ON products(is_active, owner_id);

-- Messages table indexes (for conversation loading)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Composite index for unread messages query
CREATE INDEX IF NOT EXISTS idx_messages_conv_read ON messages(conversation_id, is_read, sender_id);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- User reviews indexes
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed_user_id ON user_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewer_id ON user_reviews(reviewer_id);

-- Favorite users indexes
CREATE INDEX IF NOT EXISTS idx_favorite_users_user_id ON favorite_users(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_users_favorite_user_id ON favorite_users(favorite_user_id);

-- =====================================================
-- PHASE 2: OPTIMIZED SQL FUNCTIONS
-- =====================================================

-- Function: Search users by name with product count (fixes N+1)
CREATE OR REPLACE FUNCTION search_users_by_name(search_query text, result_limit int DEFAULT 20)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  products_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    COUNT(prod.id) as products_count
  FROM profiles p
  INNER JOIN products prod ON prod.owner_id = p.id AND prod.is_active = true
  WHERE p.full_name ILIKE '%' || search_query || '%'
  GROUP BY p.id, p.full_name, p.avatar_url
  HAVING COUNT(prod.id) > 0
  LIMIT result_limit;
$$;

-- Function: Get user reviews with reviewer info (fixes N+1)
CREATE OR REPLACE FUNCTION get_user_reviews_with_reviewers(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  reviewer_id uuid,
  reviewed_user_id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  reviewer_full_name text,
  reviewer_avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ur.id,
    ur.reviewer_id,
    ur.reviewed_user_id,
    ur.rating,
    ur.comment,
    ur.created_at,
    p.full_name as reviewer_full_name,
    p.avatar_url as reviewer_avatar_url
  FROM user_reviews ur
  LEFT JOIN profiles p ON p.id = ur.reviewer_id
  WHERE ur.reviewed_user_id = target_user_id
  ORDER BY ur.created_at DESC;
$$;

-- Function: Get user conversations with all details (fixes N+1)
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  buyer_id uuid,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  product_title text,
  product_images text[],
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    c.id,
    c.product_id,
    c.buyer_id,
    c.owner_id,
    c.created_at,
    c.updated_at,
    prod.title as product_title,
    prod.images as product_images,
    CASE WHEN c.buyer_id = user_uuid THEN c.owner_id ELSE c.buyer_id END as other_user_id,
    p.full_name as other_user_name,
    p.avatar_url as other_user_avatar,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    lm.sender_id as last_message_sender_id,
    COALESCE(unread.cnt, 0) as unread_count
  FROM conversations c
  JOIN products prod ON prod.id = c.product_id
  LEFT JOIN profiles p ON p.id = CASE WHEN c.buyer_id = user_uuid THEN c.owner_id ELSE c.buyer_id END
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.is_read = false
      AND m.sender_id != user_uuid
  ) unread ON true
  WHERE c.buyer_id = user_uuid OR c.owner_id = user_uuid
  ORDER BY c.updated_at DESC;
$$;