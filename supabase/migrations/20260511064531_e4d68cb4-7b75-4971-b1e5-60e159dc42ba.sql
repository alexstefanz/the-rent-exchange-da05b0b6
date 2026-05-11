-- 1. Coloane noi pe products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS condition             text,
  ADD COLUMN IF NOT EXISTS deposit_type          text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS deposit_value         numeric(10,2),
  ADD COLUMN IF NOT EXISTS min_rental_days       integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_rental_preset     text,
  ADD COLUMN IF NOT EXISTS delivery_available    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee          numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_radius_km    integer,
  ADD COLUMN IF NOT EXISTS pickup_available      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_lat            numeric(9,6),
  ADD COLUMN IF NOT EXISTS pickup_lng            numeric(9,6),
  ADD COLUMN IF NOT EXISTS usage_rules           text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS serial_number         text,
  ADD COLUMN IF NOT EXISTS available_immediately boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blocked_dates         date[] NOT NULL DEFAULT '{}'::date[],
  ADD COLUMN IF NOT EXISTS quality_score         integer NOT NULL DEFAULT 0;

-- Validation constraints
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_condition_check,
  ADD  CONSTRAINT products_condition_check
       CHECK (condition IS NULL OR condition IN ('new','very_good','good','used'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_deposit_type_check,
  ADD  CONSTRAINT products_deposit_type_check
       CHECK (deposit_type IN ('none','fixed','percent'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_min_rental_days_check,
  ADD  CONSTRAINT products_min_rental_days_check
       CHECK (min_rental_days >= 1 AND min_rental_days <= 365);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_quality_score_check,
  ADD  CONSTRAINT products_quality_score_check
       CHECK (quality_score >= 0 AND quality_score <= 100);

-- 2. Drafts table
CREATE TABLE IF NOT EXISTS public.product_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES public.products(id) ON DELETE CASCADE,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  step        integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_drafts_owner ON public.product_drafts(owner_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_drafts_owner_product ON public.product_drafts(owner_id, product_id) WHERE product_id IS NOT NULL;

ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own drafts" ON public.product_drafts;
CREATE POLICY "Owners manage own drafts" ON public.product_drafts
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins read drafts" ON public.product_drafts;
CREATE POLICY "Admins read drafts" ON public.product_drafts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_product_drafts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_product_drafts_updated_at ON public.product_drafts;
CREATE TRIGGER trg_product_drafts_updated_at
  BEFORE UPDATE ON public.product_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_product_drafts_updated_at();

-- 3. Pricing benchmark RPC
CREATE OR REPLACE FUNCTION public.get_similar_pricing(p_category text, p_subcategory text DEFAULT NULL)
RETURNS TABLE(p25 numeric, p50 numeric, p75 numeric, sample_size int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    percentile_cont(0.25) WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    percentile_cont(0.5)  WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    count(*)::int
  FROM public.products
  WHERE is_active = true
    AND approval_status = 'approved'
    AND deleted_at IS NULL
    AND category = p_category
    AND (p_subcategory IS NULL OR subcategory = p_subcategory);
$$;

GRANT EXECUTE ON FUNCTION public.get_similar_pricing(text, text) TO anon, authenticated;