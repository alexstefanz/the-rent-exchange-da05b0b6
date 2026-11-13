CREATE TABLE public.admin_sms_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  event_types text[] NOT NULL DEFAULT ARRAY['ticket_opened','withdrawal_requested','product_pending','kyc_needs_review','dispute_opened','cancellation_requested']::text[],
  high_priority_only boolean NOT NULL DEFAULT false,
  extra_phones text[] NOT NULL DEFAULT '{}'::text[],
  notify_all_admins boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, UPDATE ON public.admin_sms_settings TO authenticated;
GRANT ALL ON public.admin_sms_settings TO service_role;
ALTER TABLE public.admin_sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sms settings" ON public.admin_sms_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update sms settings" ON public.admin_sms_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.admin_sms_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.trg_admin_notification_sms()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.admin_sms_settings;
BEGIN
  SELECT * INTO s FROM public.admin_sms_settings WHERE id = 1;
  IF s.enabled IS NOT TRUE THEN RETURN NEW; END IF;
  IF NOT (NEW.type = ANY(s.event_types) OR (NEW.priority = 'high' AND s.high_priority_only)) THEN RETURN NEW; END IF;
  PERFORM public.invoke_edge_function_async('send-admin-sms-alert', jsonb_build_object('notification_id', NEW.id));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'admin sms trigger failed: %', SQLERRM;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.trg_admin_notification_sms() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER admin_notification_sms AFTER INSERT ON public.admin_notifications
FOR EACH ROW EXECUTE FUNCTION public.trg_admin_notification_sms();