
CREATE TABLE public.favorite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorite_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite products" ON public.favorite_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorite products" ON public.favorite_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorite products" ON public.favorite_products FOR DELETE USING (auth.uid() = user_id);
