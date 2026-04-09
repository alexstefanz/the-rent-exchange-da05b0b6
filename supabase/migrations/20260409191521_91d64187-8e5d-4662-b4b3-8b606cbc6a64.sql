
-- Change default platform fee from 20% to 5%
ALTER TABLE public.products 
  ALTER COLUMN platform_fee_percent SET DEFAULT 5.00;

-- Update default on rentals table too
ALTER TABLE public.rentals
  ALTER COLUMN platform_fee_percent SET DEFAULT 5;

-- Update all existing products from 20% to 5%
UPDATE public.products SET platform_fee_percent = 5.00 WHERE platform_fee_percent = 20.00;

-- Set first 3 products per user to 0% fee
WITH ranked AS (
  SELECT id, owner_id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
  FROM public.products
)
UPDATE public.products p
SET platform_fee_percent = 0
FROM ranked r
WHERE p.id = r.id AND r.rn <= 3;
