-- Fix EXPOSED_SENSITIVE_DATA: Phone numbers should not be exposed through product owner profiles
-- Create a function to safely get public owner info without phone numbers

-- Create a security definer function to get safe product owner info
CREATE OR REPLACE FUNCTION public.get_product_owner_public_info(owner_uuid uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = owner_uuid
  AND EXISTS (
    SELECT 1 FROM public.products prod 
    WHERE prod.owner_id = owner_uuid 
    AND prod.is_active = true
  );
$$;

-- Drop the overly permissive policy that exposes phone numbers
DROP POLICY IF EXISTS "Can view profiles of product owners" ON public.profiles;

-- Users can only view their own full profile (including phone)
-- For viewing other users' public info, use the get_product_owner_public_info function