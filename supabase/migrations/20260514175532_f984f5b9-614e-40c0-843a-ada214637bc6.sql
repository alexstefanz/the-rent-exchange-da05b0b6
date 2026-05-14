
-- Helper: ban check (SECURITY DEFINER bypasses RLS to read profiles.is_banned)
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = _user_id), false);
$$;

-- ============================================================
-- PRODUCTS: block create/update for banned users
-- ============================================================
DROP POLICY IF EXISTS "Owners can insert their own products" ON public.products;
CREATE POLICY "Owners can insert their own products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = owner_id AND NOT public.is_user_banned(auth.uid()));

DROP POLICY IF EXISTS "Owners can update their own products" ON public.products;
CREATE POLICY "Owners can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = owner_id AND NOT public.is_user_banned(auth.uid()))
WITH CHECK (auth.uid() = owner_id AND NOT public.is_user_banned(auth.uid()));

-- ============================================================
-- RENTALS: block creating new rentals (as renter or owner) for banned users
-- ============================================================
DROP POLICY IF EXISTS "Renters can create their own rentals" ON public.rentals;
DROP POLICY IF EXISTS "Users can create rentals as renter" ON public.rentals;
-- We add a generic banned-user block policy that applies to ALL inserts
DROP POLICY IF EXISTS "Block banned users from inserting rentals" ON public.rentals;
CREATE POLICY "Block banned users from inserting rentals"
ON public.rentals AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_user_banned(auth.uid()));

DROP POLICY IF EXISTS "Block banned users from updating rentals" ON public.rentals;
CREATE POLICY "Block banned users from updating rentals"
ON public.rentals AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (NOT public.is_user_banned(auth.uid()))
WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- ============================================================
-- CONVERSATIONS: block banned users from initiating
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id AND NOT public.is_user_banned(auth.uid()));

-- ============================================================
-- MESSAGES: block banned users from sending messages
-- ============================================================
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND NOT public.is_user_banned(auth.uid())
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND ((c.buyer_id = auth.uid()) OR (c.owner_id = auth.uid()))
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks b
        WHERE ((b.blocker_id = c.buyer_id AND b.blocked_id = c.owner_id)
            OR (b.blocker_id = c.owner_id AND b.blocked_id = c.buyer_id))
      )
  )
);

-- ============================================================
-- REVIEWS: block banned users
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create product reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create product reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id AND NOT public.is_user_banned(auth.uid()));

-- user_reviews if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Block banned users from creating user reviews" ON public.user_reviews';
    EXECUTE 'CREATE POLICY "Block banned users from creating user reviews" ON public.user_reviews AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_user_banned(auth.uid()))';
  END IF;
END $$;

-- ============================================================
-- WITHDRAWAL REQUESTS: block banned users from requesting payouts
-- ============================================================
DROP POLICY IF EXISTS "Block banned users from withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Block banned users from withdrawals"
ON public.withdrawal_requests AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- ============================================================
-- FAVORITES: block banned users
-- ============================================================
DROP POLICY IF EXISTS "Users can add favorite products" ON public.favorite_products;
CREATE POLICY "Users can add favorite products"
ON public.favorite_products FOR INSERT
WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorite_users;
CREATE POLICY "Users can add favorites"
ON public.favorite_users FOR INSERT
WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

-- ============================================================
-- TRIGGER: when user is banned, deactivate all their products
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_user_ban_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_banned = true AND (OLD.is_banned IS DISTINCT FROM true) THEN
    UPDATE public.products
    SET is_active = false
    WHERE owner_id = NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_ban_status_change ON public.profiles;
CREATE TRIGGER trg_user_ban_status_change
AFTER UPDATE OF is_banned ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_ban_status_change();

-- Backfill: deactivate products of currently banned users
UPDATE public.products p
SET is_active = false
FROM public.profiles pr
WHERE p.owner_id = pr.id AND pr.is_banned = true AND p.is_active = true;
