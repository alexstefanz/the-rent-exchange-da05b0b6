-- Notification audit log
CREATE TABLE IF NOT EXISTS public.notification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID,
  user_id UUID NOT NULL,
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','email','sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','skipped')),
  provider_id TEXT,
  error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_audit_rental ON public.notification_audit_log(rental_id);
CREATE INDEX IF NOT EXISTS idx_notif_audit_user ON public.notification_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_audit_event ON public.notification_audit_log(rental_id, event_key, user_id, channel);
CREATE INDEX IF NOT EXISTS idx_notif_audit_created ON public.notification_audit_log(created_at DESC);
ALTER TABLE public.notification_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notif audit"
  ON public.notification_audit_log FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY,
  email_marketing BOOLEAN NOT NULL DEFAULT true,
  sms_marketing BOOLEAN NOT NULL DEFAULT true,
  email_transactional BOOLEAN NOT NULL DEFAULT true,
  sms_transactional BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notif prefs"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own notif prefs"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notif prefs"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Secure short-lived action tokens for SMS deep-links
CREATE TABLE IF NOT EXISTS public.secure_action_tokens (
  token TEXT PRIMARY KEY,
  rental_id UUID,
  user_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  redirect_path TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_action_tokens_user ON public.secure_action_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_action_tokens_expires ON public.secure_action_tokens(expires_at);
ALTER TABLE public.secure_action_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own action tokens"
  ON public.secure_action_tokens FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for preferences
CREATE OR REPLACE FUNCTION public.set_notif_prefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_notif_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_notif_prefs_updated_at();