ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_rental_days integer NULL;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_max_rental_days_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_max_rental_days_check
  CHECK (max_rental_days IS NULL OR max_rental_days >= COALESCE(min_rental_days, 1));