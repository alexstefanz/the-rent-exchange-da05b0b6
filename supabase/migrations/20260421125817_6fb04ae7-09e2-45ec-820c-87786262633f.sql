-- 1. Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title_ro text NOT NULL,
  title_en text,
  description_ro text,
  description_en text,
  link text,
  entity_id uuid,
  entity_type text,
  priority text NOT NULL DEFAULT 'normal',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications (is_read, created_at DESC);
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications (type);
CREATE INDEX idx_admin_notifications_created ON public.admin_notifications (created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Admins can view all admin notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admin notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete admin notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT policy: only triggers (SECURITY DEFINER) can insert.

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

-- 6. Trigger functions

-- KYC submitted / needs manual review
CREATE OR REPLACE FUNCTION public.notify_admin_kyc_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
BEGIN
  -- Only fire on transitions into SUBMITTED or NEEDS_MANUAL_REVIEW
  IF NEW.status NOT IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_user_name FROM profiles WHERE id = NEW.user_id;

  IF NEW.status = 'NEEDS_MANUAL_REVIEW' THEN
    INSERT INTO public.admin_notifications
      (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
    VALUES (
      'kyc_needs_review',
      'KYC necesită revizuire manuală',
      'KYC needs manual review',
      'Cazul ' || NEW.public_id || ' (' || COALESCE(v_user_name, 'utilizator') || ') necesită atenție.',
      'Case ' || NEW.public_id || ' (' || COALESCE(v_user_name, 'user') || ') needs attention.',
      '/admin/kyc/' || NEW.id::text,
      NEW.id,
      'kyc_case',
      'high'
    );
  ELSE
    INSERT INTO public.admin_notifications
      (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
    VALUES (
      'kyc_submitted',
      'KYC nou trimis',
      'New KYC submitted',
      COALESCE(v_user_name, 'Un utilizator') || ' a trimis cazul ' || NEW.public_id || '.',
      COALESCE(v_user_name, 'A user') || ' submitted case ' || NEW.public_id || '.',
      '/admin/kyc/' || NEW.id::text,
      NEW.id,
      'kyc_case',
      'normal'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_kyc
  AFTER INSERT OR UPDATE ON public.kyc_cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_kyc_event();

-- Product pending approval
CREATE OR REPLACE FUNCTION public.notify_admin_product_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_name text;
BEGIN
  IF NEW.approval_status <> 'pending' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_owner_name FROM profiles WHERE id = NEW.owner_id;

  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'product_pending',
    'Produs nou de aprobat',
    'New product to approve',
    COALESCE(v_owner_name, 'Un utilizator') || ' a publicat: ' || NEW.title,
    COALESCE(v_owner_name, 'A user') || ' published: ' || NEW.title,
    '/admin/approvals',
    NEW.id,
    'product',
    'normal'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_product
  AFTER INSERT OR UPDATE OF approval_status ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_product_pending();

-- Ticket opened
CREATE OR REPLACE FUNCTION public.notify_admin_ticket_opened()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_priority text;
BEGIN
  v_priority := CASE WHEN NEW.priority = 'URGENT' THEN 'high' ELSE 'normal' END;

  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'ticket_opened',
    'Ticket nou: ' || NEW.public_id,
    'New ticket: ' || NEW.public_id,
    NEW.title,
    NEW.title,
    '/admin/tickets/' || NEW.id::text,
    NEW.id,
    'ticket',
    v_priority
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_ticket
  AFTER INSERT ON public.ops_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_ticket_opened();

-- Withdrawal requested
CREATE OR REPLACE FUNCTION public.notify_admin_withdrawal_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_user_name FROM profiles WHERE id = NEW.user_id;

  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'withdrawal_requested',
    'Cerere nouă de retragere',
    'New withdrawal request',
    COALESCE(v_user_name, 'Utilizator') || ' solicită ' || NEW.amount::text || ' RON',
    COALESCE(v_user_name, 'User') || ' requests ' || NEW.amount::text || ' RON',
    '/admin/finances',
    NEW.id,
    'withdrawal',
    'normal'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_withdrawal
  AFTER INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_withdrawal_requested();

-- New user signup
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'new_user_signup',
    'Utilizator nou înregistrat',
    'New user signed up',
    COALESCE(NEW.full_name, NEW.email, 'Utilizator nou'),
    COALESCE(NEW.full_name, NEW.email, 'New user'),
    '/admin/users/' || NEW.id::text,
    NEW.id,
    'user',
    'low'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_notify_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

-- 7. Summary RPC
CREATE OR REPLACE FUNCTION public.get_admin_notification_summary()
RETURNS TABLE(
  unread_total bigint,
  pending_kyc bigint,
  pending_products bigint,
  open_tickets bigint,
  pending_withdrawals bigint,
  unread_high_priority bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false),
    (SELECT COUNT(*) FROM kyc_cases WHERE status IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW')),
    (SELECT COUNT(*) FROM products WHERE approval_status = 'pending'),
    (SELECT COUNT(*) FROM ops_tickets WHERE status NOT IN ('CLOSED', 'RESOLVED')),
    (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'),
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false AND priority = 'high');
END;
$$;

-- 8. Backfill existing pending items as notifications
INSERT INTO public.admin_notifications (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority, created_at)
SELECT
  'kyc_submitted',
  'KYC în așteptare',
  'KYC pending',
  'Cazul ' || kc.public_id || ' așteaptă revizuire.',
  'Case ' || kc.public_id || ' awaiting review.',
  '/admin/kyc/' || kc.id::text,
  kc.id,
  'kyc_case',
  CASE WHEN kc.status = 'NEEDS_MANUAL_REVIEW' THEN 'high' ELSE 'normal' END,
  COALESCE(kc.submitted_at, kc.updated_at, kc.created_at)
FROM kyc_cases kc
WHERE kc.status IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW');

INSERT INTO public.admin_notifications (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority, created_at)
SELECT
  'product_pending',
  'Produs în așteptare',
  'Pending product',
  p.title,
  p.title,
  '/admin/approvals',
  p.id,
  'product',
  'normal',
  COALESCE(p.created_at, now())
FROM products p
WHERE p.approval_status = 'pending';

INSERT INTO public.admin_notifications (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority, created_at)
SELECT
  'ticket_opened',
  'Ticket deschis: ' || t.public_id,
  'Open ticket: ' || t.public_id,
  t.title,
  t.title,
  '/admin/tickets/' || t.id::text,
  t.id,
  'ticket',
  CASE WHEN t.priority = 'URGENT' THEN 'high' ELSE 'normal' END,
  t.created_at
FROM ops_tickets t
WHERE t.status NOT IN ('CLOSED', 'RESOLVED');

INSERT INTO public.admin_notifications (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority, created_at)
SELECT
  'withdrawal_requested',
  'Retragere în așteptare',
  'Pending withdrawal',
  w.amount::text || ' RON',
  w.amount::text || ' RON',
  '/admin/finances',
  w.id,
  'withdrawal',
  'normal',
  w.created_at
FROM withdrawal_requests w
WHERE w.status = 'pending';