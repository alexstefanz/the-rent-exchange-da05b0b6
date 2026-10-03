CREATE TABLE public.chat_notification_cooldown (
  conversation_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, recipient_id)
);
GRANT ALL ON public.chat_notification_cooldown TO service_role;
ALTER TABLE public.chat_notification_cooldown ENABLE ROW LEVEL SECURITY;

-- Atomically claims the right to send an external notification.
-- Returns true if no notification was sent in the last _minutes for this conversation/recipient.
CREATE OR REPLACE FUNCTION public.claim_chat_notification(_conversation_id uuid, _recipient_id uuid, _minutes int DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE claimed boolean;
BEGIN
  INSERT INTO public.chat_notification_cooldown AS c (conversation_id, recipient_id, last_sent_at)
  VALUES (_conversation_id, _recipient_id, now())
  ON CONFLICT (conversation_id, recipient_id) DO UPDATE
    SET last_sent_at = now()
    WHERE c.last_sent_at < now() - make_interval(mins => _minutes)
  RETURNING true INTO claimed;
  RETURN COALESCE(claimed, false);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_chat_notification(uuid, uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_chat_notification(uuid, uuid, int) TO service_role;