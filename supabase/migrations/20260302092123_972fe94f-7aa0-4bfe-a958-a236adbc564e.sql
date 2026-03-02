
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deactivated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivation_token text,
  ADD COLUMN IF NOT EXISTS deactivation_token_expires_at timestamptz;
