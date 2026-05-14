-- Add reported_user_id column to message_reports
ALTER TABLE public.message_reports
  ADD COLUMN IF NOT EXISTS reported_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user_id
  ON public.message_reports(reported_user_id);

-- Backfill from message author when available
UPDATE public.message_reports r
SET reported_user_id = m.sender_id
FROM public.messages m
WHERE r.message_id = m.id
  AND r.reported_user_id IS NULL
  AND m.sender_id IS NOT NULL;

-- Backfill from conversation: the participant that is NOT the reporter
UPDATE public.message_reports r
SET reported_user_id = CASE
  WHEN c.buyer_id = r.reporter_id THEN c.owner_id
  WHEN c.owner_id = r.reporter_id THEN c.buyer_id
  ELSE NULL
END
FROM public.conversations c
WHERE r.conversation_id = c.id
  AND r.reported_user_id IS NULL;

-- ============= user_warnings table =============
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  category text,
  related_report_id uuid REFERENCES public.message_reports(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON public.user_warnings(user_id, created_at DESC);

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage warnings" ON public.user_warnings;
CREATE POLICY "Admins manage warnings"
ON public.user_warnings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own warnings" ON public.user_warnings;
CREATE POLICY "Users view own warnings"
ON public.user_warnings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users acknowledge own warnings" ON public.user_warnings;
CREATE POLICY "Users acknowledge own warnings"
ON public.user_warnings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());