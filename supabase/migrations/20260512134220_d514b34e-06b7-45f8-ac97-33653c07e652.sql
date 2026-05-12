ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'user';

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('user','system'));

ALTER TABLE public.messages
  ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_required_for_user;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_required_for_user
  CHECK (message_type = 'system' OR sender_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_messages_conv_type
  ON public.messages (conversation_id, message_type);