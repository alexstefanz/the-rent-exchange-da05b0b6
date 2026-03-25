
-- Add approval_status column if not exists (with default 'approved' for existing products)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.products ADD COLUMN approval_status text NOT NULL DEFAULT 'approved';
  END IF;
END $$;

-- Update RLS policy to require approval_status = 'approved'
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO public
  USING (is_active = true AND approval_status = 'approved');
