
CREATE TABLE public.phone_otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otp_user_created ON public.phone_otp_verifications (user_id, created_at DESC);

ALTER TABLE public.phone_otp_verifications ENABLE ROW LEVEL SECURITY;
-- No policies: deny-by-default. Only service role (edge functions) can access.
