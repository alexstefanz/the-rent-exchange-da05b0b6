
-- Add SMS opt-out column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean NOT NULL DEFAULT true;

-- Create sms_logs table for audit, idempotency and cost tracking
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  rental_id uuid,
  recipient_phone text NOT NULL,
  template_key text NOT NULL,
  message_body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  idempotency_key text NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_rental_id ON public.sms_logs(rental_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read SMS logs
CREATE POLICY "Admins can view sms logs"
  ON public.sms_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert sms logs"
  ON public.sms_logs FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update (edge functions)
CREATE POLICY "Service role can update sms logs"
  ON public.sms_logs FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
