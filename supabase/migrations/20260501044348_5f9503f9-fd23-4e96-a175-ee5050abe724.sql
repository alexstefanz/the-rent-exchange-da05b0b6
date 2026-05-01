-- 1. Drop legacy unique constraint
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_product_id_buyer_id_key;

-- 2. Add nullable rentals_id linking a conversation to a specific rental booking
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS rentals_id uuid NULL
    REFERENCES public.rentals(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_rentals_id_unique
  ON public.conversations(rentals_id)
  WHERE rentals_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_organic_lookup
  ON public.conversations(product_id, buyer_id)
  WHERE rentals_id IS NULL;

-- 3. RPC: get or create the conversation bound to a specific rental
CREATE OR REPLACE FUNCTION public.get_or_create_rental_conversation(p_rental_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_rental record;
  v_conv_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id, product_id, renter_id, owner_id
    INTO v_rental
    FROM public.rentals
   WHERE id = p_rental_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rental not found';
  END IF;

  IF v_caller <> v_rental.renter_id AND v_caller <> v_rental.owner_id THEN
    RAISE EXCEPTION 'not a participant of this rental';
  END IF;

  SELECT id INTO v_conv_id
    FROM public.conversations
   WHERE rentals_id = p_rental_id;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO public.conversations (product_id, buyer_id, owner_id, rentals_id)
  VALUES (v_rental.product_id, v_rental.renter_id, v_rental.owner_id, p_rental_id)
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_rental_conversation(uuid) TO authenticated;

-- 4. Recreate get_user_conversations with rental context
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);

CREATE FUNCTION public.get_user_conversations(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  buyer_id uuid,
  owner_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  product_title text,
  product_images text[],
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_content text,
  last_message_created_at timestamp with time zone,
  last_message_sender_id uuid,
  unread_count bigint,
  rentals_id uuid,
  rental_start_date date,
  rental_end_date date,
  rental_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    COALESCE(unread.cnt, 0) as unread_count,
    c.rentals_id,
    r.start_date as rental_start_date,
    r.end_date as rental_end_date,
    r.rental_days
  FROM public.conversations c
  JOIN public.products prod ON prod.id = c.product_id
  JOIN public.profiles p ON p.id = (CASE WHEN c.buyer_id = user_uuid THEN c.owner_id ELSE c.buyer_id END)
  LEFT JOIN public.rentals r ON r.id = c.rentals_id
  LEFT JOIN LATERAL (
    SELECT m.content, m.created_at, m.sender_id
      FROM public.messages m
     WHERE m.conversation_id = c.id
     ORDER BY m.created_at DESC
     LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint as cnt
      FROM public.messages m
     WHERE m.conversation_id = c.id
       AND m.sender_id <> user_uuid
       AND m.is_read = false
  ) unread ON true
  WHERE c.buyer_id = user_uuid OR c.owner_id = user_uuid
  ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
$$;
