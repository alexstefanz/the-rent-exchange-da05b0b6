
-- Allow authenticated users to SELECT their own tickets
CREATE POLICY "Users can view own tickets"
ON public.ops_tickets
FOR SELECT
TO authenticated
USING (requester_user_id = auth.uid());

-- Allow authenticated users to INSERT tickets with requester_user_id = auth.uid()
CREATE POLICY "Users can create own tickets"
ON public.ops_tickets
FOR INSERT
TO authenticated
WITH CHECK (requester_user_id = auth.uid());

-- Allow users to SELECT non-internal messages on their own tickets
CREATE POLICY "Users can view own ticket messages"
ON public.ops_ticket_messages
FOR SELECT
TO authenticated
USING (
  is_internal = false
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id = ticket_id
    AND t.requester_user_id = auth.uid()
  )
);

-- Allow users to INSERT non-internal messages on their own tickets
CREATE POLICY "Users can add messages to own tickets"
ON public.ops_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  is_internal = false
  AND author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id = ticket_id
    AND t.requester_user_id = auth.uid()
  )
);

-- Allow users to SELECT attachments on their own tickets (non-internal messages only)
CREATE POLICY "Users can view own ticket attachments"
ON public.ops_ticket_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id = ticket_id
    AND t.requester_user_id = auth.uid()
  )
  AND (
    message_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.ops_ticket_messages m
      WHERE m.id = message_id
      AND m.is_internal = false
    )
  )
);

-- Allow users to INSERT attachments on their own tickets
CREATE POLICY "Users can add attachments to own tickets"
ON public.ops_ticket_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id = ticket_id
    AND t.requester_user_id = auth.uid()
  )
);
