ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET phone_verified = true WHERE phone_verified = false;