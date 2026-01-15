-- Make the product-images bucket public again so images can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Keep the existing RLS policies for upload security
-- The bucket being public only affects READ access (getPublicUrl works)
-- Upload/delete operations still respect RLS policies