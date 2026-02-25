
-- ============================================
-- Phase 1: Operational Tickets Module
-- ============================================

-- 1. Sequence for public_id
CREATE SEQUENCE IF NOT EXISTS ops_ticket_seq START 1;

-- 2. ops_tickets table
CREATE TABLE public.ops_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text UNIQUE NOT NULL DEFAULT 'TCK-000000',
  title text NOT NULL,
  description text NOT NULL,
  category_group text NOT NULL,
  category_type text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'NEW',
  created_by uuid,
  assigned_to uuid,
  requester_user_id uuid,
  rental_user_id uuid,
  owner_user_id uuid,
  reservation_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- Indexes
CREATE INDEX idx_ops_tickets_public_id ON public.ops_tickets(public_id);
CREATE INDEX idx_ops_tickets_status ON public.ops_tickets(status);
CREATE INDEX idx_ops_tickets_priority ON public.ops_tickets(priority);
CREATE INDEX idx_ops_tickets_category_type ON public.ops_tickets(category_type);
CREATE INDEX idx_ops_tickets_reservation_id ON public.ops_tickets(reservation_id);
CREATE INDEX idx_ops_tickets_product_id ON public.ops_tickets(product_id);
CREATE INDEX idx_ops_tickets_rental_user_id ON public.ops_tickets(rental_user_id);
CREATE INDEX idx_ops_tickets_owner_user_id ON public.ops_tickets(owner_user_id);
CREATE INDEX idx_ops_tickets_assigned_to ON public.ops_tickets(assigned_to);

-- 3. Auto-generate public_id trigger
CREATE OR REPLACE FUNCTION public.generate_ops_ticket_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('ops_ticket_seq');
  NEW.public_id := 'TCK-' || lpad(next_val::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ops_ticket_public_id
  BEFORE INSERT ON public.ops_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ops_ticket_public_id();

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_ops_tickets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ops_tickets_updated_at
  BEFORE UPDATE ON public.ops_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ops_tickets_updated_at();

-- 5. ops_ticket_messages table
CREATE TABLE public.ops_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.ops_tickets(id) ON DELETE CASCADE,
  author_type text NOT NULL,
  author_id uuid,
  message_text text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_ticket_messages_ticket_id ON public.ops_ticket_messages(ticket_id);

-- 6. ops_ticket_attachments table
CREATE TABLE public.ops_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.ops_tickets(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.ops_ticket_messages(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by_type text,
  uploaded_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_ticket_attachments_ticket_id ON public.ops_ticket_attachments(ticket_id);

-- 7. ops_ticket_audit_log table
CREATE TABLE public.ops_ticket_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.ops_tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value text,
  new_value text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_ticket_audit_log_ticket_id ON public.ops_ticket_audit_log(ticket_id);

-- 8. RLS on all tables
ALTER TABLE public.ops_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_ticket_audit_log ENABLE ROW LEVEL SECURITY;

-- ops_tickets policies
CREATE POLICY "Admins can do everything on ops_tickets"
  ON public.ops_tickets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ops_ticket_messages policies
CREATE POLICY "Admins can do everything on ops_ticket_messages"
  ON public.ops_ticket_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ops_ticket_attachments policies
CREATE POLICY "Admins can do everything on ops_ticket_attachments"
  ON public.ops_ticket_attachments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ops_ticket_audit_log policies
CREATE POLICY "Admins can do everything on ops_ticket_audit_log"
  ON public.ops_ticket_audit_log FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Admins can upload ticket attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view ticket attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ticket attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(), 'admin'));
