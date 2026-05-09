
-- 1. Add read_at to ops_ticket_messages
ALTER TABLE public.ops_ticket_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ops_ticket_messages_ticket_read
  ON public.ops_ticket_messages (ticket_id, author_type, read_at);

-- 2. Storage policies on ticket-attachments to allow users to upload to OWN ticket folder
-- Path convention: <ticket_id>/<filename>
CREATE POLICY "Users can upload to own ticket folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND t.requester_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND t.requester_user_id = auth.uid()
  )
);

-- 3. RPC to mark non-customer messages as read on own ticket
CREATE OR REPLACE FUNCTION public.mark_ticket_messages_read(p_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if the caller is the requester
  IF NOT EXISTS (
    SELECT 1 FROM public.ops_tickets
    WHERE id = p_ticket_id AND requester_user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  UPDATE public.ops_ticket_messages
  SET read_at = now()
  WHERE ticket_id = p_ticket_id
    AND author_type <> 'CUSTOMER'
    AND is_internal = false
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_ticket_messages_read(uuid) TO authenticated;

-- 4. Trigger: bump ops_tickets.updated_at on new message + notify requester
CREATE OR REPLACE FUNCTION public.handle_new_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester uuid;
  v_public_id text;
  v_title text;
BEGIN
  -- Skip internal notes
  IF NEW.is_internal = true THEN
    RETURN NEW;
  END IF;

  -- Bump updated_at on parent ticket
  UPDATE public.ops_tickets
  SET updated_at = NEW.created_at
  WHERE id = NEW.ticket_id
  RETURNING requester_user_id, public_id, title
  INTO v_requester, v_public_id, v_title;

  -- Notify requester only when message is NOT from the customer
  IF NEW.author_type <> 'CUSTOMER' AND v_requester IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title_ro, title_en, description_ro, description_en, link)
    VALUES (
      v_requester,
      'support',
      'Răspuns nou la ticketul ' || COALESCE(v_public_id, ''),
      'New reply on ticket ' || COALESCE(v_public_id, ''),
      LEFT(NEW.message_text, 140),
      LEFT(NEW.message_text, 140),
      '/suport?open=' || NEW.ticket_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_ticket_message ON public.ops_ticket_messages;
CREATE TRIGGER trg_handle_new_ticket_message
AFTER INSERT ON public.ops_ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_ticket_message();
