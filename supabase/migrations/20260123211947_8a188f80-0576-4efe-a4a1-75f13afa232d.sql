-- Security Hardening: Fix RLS policies with proper WITH CHECK constraints

-- 1. Fix products UPDATE policy to prevent owner_id tampering
DROP POLICY IF EXISTS "Owners can update their own products" ON public.products;
CREATE POLICY "Owners can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 2. Fix user_reviews INSERT policy to ensure reviewer_id matches auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.user_reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.user_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- 3. Fix product_reviews INSERT policy to ensure reviewer_id matches auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create product reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create product reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);