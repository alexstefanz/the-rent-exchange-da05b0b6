ALTER TABLE public.message_reports
  ADD COLUMN IF NOT EXISTS conversation_id uuid NULL REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_message_reports_conversation_id
  ON public.message_reports(conversation_id);

-- Backfill from message_id when present
UPDATE public.message_reports r
SET conversation_id = m.conversation_id
FROM public.messages m
WHERE r.conversation_id IS NULL
  AND r.message_id IS NOT NULL
  AND m.id = r.message_id;

-- Backfill from UUID embedded in reason ("Conversation <uuid>")
UPDATE public.message_reports r
SET conversation_id = c.id
FROM public.conversations c
WHERE r.conversation_id IS NULL
  AND r.reason IS NOT NULL
  AND r.reason ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  AND c.id::text = (regexp_match(r.reason, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'i'))[1];