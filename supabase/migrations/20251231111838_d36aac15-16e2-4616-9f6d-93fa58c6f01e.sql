-- Fix PUBLIC_DATA_EXPOSURE: Profiles should not be publicly readable
-- Users should only see their own profile, with limited visibility for product owners

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile (full access to own data)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow viewing profile of product owners (for displaying owner info on product pages)
-- This allows authenticated users to see profiles of users who have active products
CREATE POLICY "Can view profiles of product owners" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.owner_id = profiles.id 
    AND products.is_active = true
  )
);