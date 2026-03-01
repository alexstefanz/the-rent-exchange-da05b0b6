
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS rating_product_condition integer,
  ADD COLUMN IF NOT EXISTS rating_communication integer,
  ADD COLUMN IF NOT EXISTS rating_punctuality integer,
  ADD COLUMN IF NOT EXISTS review_type text NOT NULL DEFAULT 'owner';
