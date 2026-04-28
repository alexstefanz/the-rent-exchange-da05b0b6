
-- 1. Admin specializations table
CREATE TABLE public.admin_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_group text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_group)
);

ALTER TABLE public.admin_specializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage specializations"
  ON public.admin_specializations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_admin_specializations_category ON public.admin_specializations(category_group);
CREATE INDEX idx_admin_specializations_user ON public.admin_specializations(user_id);

-- 2. Replace the existing admin notification trigger with one that also auto-routes
--    (the existing notify_admin_ticket_opened only handled notifications)
DROP TRIGGER IF EXISTS notify_admin_ticket_opened_trigger ON public.ops_tickets;
DROP TRIGGER IF EXISTS trg_notify_admin_ticket_opened ON public.ops_tickets;

CREATE OR REPLACE FUNCTION public.handle_new_ops_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_admin uuid;
  v_priority_label text;
BEGIN
  -- Auto-routing: pick a specialized admin with the lightest open ticket queue
  IF NEW.assigned_to IS NULL THEN
    SELECT s.user_id INTO selected_admin
    FROM admin_specializations s
    WHERE s.category_group = NEW.category_group
    ORDER BY (
      SELECT COUNT(*)
      FROM ops_tickets t
      WHERE t.assigned_to = s.user_id
        AND t.status NOT IN ('CLOSED', 'RESOLVED')
    ) ASC, random()
    LIMIT 1;
    IF selected_admin IS NOT NULL THEN
      NEW.assigned_to := selected_admin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_new_ops_ticket_routing
  BEFORE INSERT ON public.ops_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_ops_ticket();

-- 3. Update existing admin notification function to honour the new ticket priority levels
CREATE OR REPLACE FUNCTION public.notify_admin_ticket_opened()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_priority text;
BEGIN
  v_priority := CASE
    WHEN NEW.priority IN ('CRITICAL', 'URGENT') THEN 'urgent'
    WHEN NEW.priority = 'HIGH' THEN 'high'
    ELSE 'normal'
  END;

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
