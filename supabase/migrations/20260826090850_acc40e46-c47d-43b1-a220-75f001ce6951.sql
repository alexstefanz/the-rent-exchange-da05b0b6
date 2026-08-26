
-- 1) Conversations: lock identity columns on update
CREATE OR REPLACE FUNCTION public.enforce_conversations_participant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- service_role / internal jobs
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Not allowed to reassign conversation participants or listing';
    END IF;
  END IF;

  -- Participants may only touch read/activity tracking columns
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    IF NEW.rentals_id IS DISTINCT FROM OLD.rentals_id THEN
      RAISE EXCEPTION 'Not allowed to change conversation rental link';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_conversations_participant_update ON public.conversations;
CREATE TRIGGER trg_enforce_conversations_participant_update
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.enforce_conversations_participant_update();

-- Keep policy explicit for both parties
DROP POLICY IF EXISTS "Conversation participants can update conversation" ON public.conversations;
CREATE POLICY "Conversation participants can update conversation"
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = owner_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = owner_id);

-- 2) Messages: recipients may only flip is_read
CREATE OR REPLACE FUNCTION public.enforce_message_recipient_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF OLD.sender_id IS DISTINCT FROM auth.uid() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.message_type IS DISTINCT FROM OLD.message_type
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
       OR NEW.hidden_at IS DISTINCT FROM OLD.hidden_at
       OR NEW.hidden_by IS DISTINCT FROM OLD.hidden_by THEN
      RAISE EXCEPTION 'Only the read status can be updated on received messages';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_recipient_update ON public.messages;
CREATE TRIGGER trg_enforce_message_recipient_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_recipient_update();

DROP POLICY IF EXISTS "Users can mark their received messages as read" ON public.messages;
CREATE POLICY "Users can mark their received messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
  AND sender_id IS DISTINCT FROM auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
  AND sender_id IS DISTINCT FROM auth.uid()
);
