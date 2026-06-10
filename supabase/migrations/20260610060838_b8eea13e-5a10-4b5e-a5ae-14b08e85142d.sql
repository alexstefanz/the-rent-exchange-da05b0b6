ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_source text,
  ADD COLUMN IF NOT EXISTS full_name_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_name_verified_at timestamptz;