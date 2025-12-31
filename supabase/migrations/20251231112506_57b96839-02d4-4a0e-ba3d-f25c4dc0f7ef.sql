-- Fix STORAGE_EXPOSURE: Make inactive product images private while preserving functionality

-- Update bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'product-images';

-- Drop existing view policy
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Create new policy: Allow viewing images of active products OR own images
CREATE POLICY "View images of active products or own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' AND (
    -- Allow viewing own images (for owners to see their inactive products)
    (auth.uid()::text = (storage.foldername(name))[1])
    OR
    -- Allow viewing images of active products (for public product listings)
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.owner_id::text = (storage.foldername(name))[1]
      AND products.is_active = true
    )
  )
);