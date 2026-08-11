CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.product_views TO service_role;

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view product views"
ON public.product_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_product_views_product_created ON public.product_views (product_id, created_at DESC);
CREATE INDEX idx_product_views_dedupe ON public.product_views (product_id, visitor_hash, created_at DESC);

CREATE OR REPLACE FUNCTION public.track_product_view(p_product_id uuid, p_visitor_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF p_product_id IS NULL OR coalesce(p_visitor_hash, '') = '' THEN
    RETURN;
  END IF;

  SELECT owner_id INTO v_owner FROM public.products WHERE id = p_product_id;
  IF v_owner IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = v_owner THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.product_views
    WHERE product_id = p_product_id
      AND visitor_hash = left(p_visitor_hash, 100)
      AND created_at > now() - interval '24 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.product_views (product_id, user_id, visitor_hash)
  VALUES (p_product_id, auth.uid(), left(p_visitor_hash, 100));
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_product_view(uuid, text) TO anon, authenticated;