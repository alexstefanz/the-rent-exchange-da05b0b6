
-- Performance indexes for rentals table
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON public.rentals (renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON public.rentals (owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON public.rentals (product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals (status);
CREATE INDEX IF NOT EXISTS idx_rentals_product_status ON public.rentals (product_id, status);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at_desc ON public.rentals (created_at DESC);

-- Performance indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);

-- Performance indexes for product_reviews table
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reviewer_id ON public.product_reviews (reviewer_id);

-- Performance index for profiles (trigram search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);

-- Performance indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rental_id ON public.transactions (rental_id);

-- Performance indexes for support_tickets table
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status);
