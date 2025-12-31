-- Make product-images bucket public so images can be viewed by everyone
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Keep the existing RLS policies for upload/delete (only owners can modify)
-- but allow public read access to all product images