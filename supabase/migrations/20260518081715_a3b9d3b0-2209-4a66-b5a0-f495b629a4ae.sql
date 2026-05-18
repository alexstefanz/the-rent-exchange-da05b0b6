ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL;
ALTER TABLE public.user_reviews ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_product_reviews_rental_id ON public.product_reviews(rental_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_rental_id ON public.user_reviews(rental_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_reviews_per_rental ON public.product_reviews(reviewer_id, rental_id, review_type) WHERE rental_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_reviews_per_rental ON public.user_reviews(reviewer_id, reviewed_user_id, rental_id) WHERE rental_id IS NOT NULL;