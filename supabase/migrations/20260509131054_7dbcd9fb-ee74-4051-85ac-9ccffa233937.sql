-- 1. Add soft-delete columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;

CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. Update RLS policies to exclude soft-deleted products from public/owner views
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  TO public
  USING (is_active = true AND approval_status = 'approved' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Owners can view their own products" ON public.products;
CREATE POLICY "Owners can view their own products"
  ON public.products FOR SELECT
  TO public
  USING (auth.uid() = owner_id AND deleted_at IS NULL);

-- 3. Purge function: hard-delete products soft-deleted >14 days
CREATE OR REPLACE FUNCTION public.purge_expired_deleted_products()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.products
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (now() - interval '14 days')
    RETURNING id
  )
  SELECT count(*) INTO purged_count FROM deleted;
  RETURN purged_count;
END;
$$;

-- 4. Schedule daily purge via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-deleted-products') THEN
    PERFORM cron.schedule(
      'purge-expired-deleted-products',
      '0 3 * * *',
      $cron$ SELECT public.purge_expired_deleted_products(); $cron$
    );
  END IF;
END $$;