
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS cui text,
  ADD COLUMN IF NOT EXISTS reg_com text,
  ADD COLUMN IF NOT EXISTS company_address text;
