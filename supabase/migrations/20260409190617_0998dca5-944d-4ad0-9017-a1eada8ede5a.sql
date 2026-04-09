ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS admin_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_edited_by uuid;