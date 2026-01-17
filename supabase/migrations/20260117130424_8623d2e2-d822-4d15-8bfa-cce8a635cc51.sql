-- Create table for favorite users
CREATE TABLE public.favorite_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorite_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, favorite_user_id),
  CHECK (user_id != favorite_user_id)
);

-- Enable RLS
ALTER TABLE public.favorite_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorite_users
CREATE POLICY "Users can view their own favorites"
  ON public.favorite_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorite_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON public.favorite_users FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for user reviews (for future use after rentals system)
CREATE TABLE public.user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Will add rental_id foreign key when rentals table is created
  CHECK (reviewer_id != reviewed_user_id)
);

-- Enable RLS
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_reviews
CREATE POLICY "Anyone can view reviews"
  ON public.user_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON public.user_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.user_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Create table for product reviews
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_reviews
CREATE POLICY "Anyone can view product reviews"
  ON public.product_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create product reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own product reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own product reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(target_user_id uuid)
RETURNS TABLE(
  products_count bigint,
  member_since timestamp with time zone,
  average_rating numeric,
  reviews_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM products WHERE owner_id = target_user_id AND is_active = true) as products_count,
    (SELECT created_at FROM profiles WHERE id = target_user_id) as member_since,
    (SELECT COALESCE(AVG(rating)::numeric, 0) FROM user_reviews WHERE reviewed_user_id = target_user_id) as average_rating,
    (SELECT COUNT(*) FROM user_reviews WHERE reviewed_user_id = target_user_id) as reviews_count;
$$;

-- Function to check if user is in favorites
CREATE OR REPLACE FUNCTION public.is_user_favorite(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM favorite_users 
    WHERE user_id = auth.uid() 
    AND favorite_user_id = target_user_id
  );
$$;