-- Fix 1: Add UPDATE policy for conversations table so participants can update timestamp
CREATE POLICY "Conversation participants can update conversation"
ON public.conversations FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = owner_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = owner_id
);

-- Fix 2: Make product-images bucket private to protect inactive product images
UPDATE storage.buckets 
SET public = false 
WHERE id = 'product-images';

-- Ensure proper storage policy exists for viewing images
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "View images of active products or own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Create secure SELECT policy: only show images of active products OR own images
CREATE POLICY "View images of active products or own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' AND (
    -- Owner can see their own images
    (auth.uid()::text = (storage.foldername(name))[1])
    -- Anyone can see images of active products
    OR EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.owner_id::text = (storage.foldername(name))[1]
      AND products.is_active = true
    )
  )
);