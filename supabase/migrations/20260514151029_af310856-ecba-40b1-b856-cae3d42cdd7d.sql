
-- 1) message_reports: triage fields + public id
ALTER TABLE public.message_reports
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS action_taken text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS public_id text;

CREATE INDEX IF NOT EXISTS idx_message_reports_resolved_created
  ON public.message_reports (resolved, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS public.message_reports_public_id_seq START 1;

CREATE OR REPLACE FUNCTION public.set_message_report_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL OR NEW.public_id = '' THEN
    NEW.public_id := 'RPT-' || lpad(nextval('public.message_reports_public_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_reports_public_id ON public.message_reports;
CREATE TRIGGER trg_message_reports_public_id
BEFORE INSERT ON public.message_reports
FOR EACH ROW EXECUTE FUNCTION public.set_message_report_public_id();

UPDATE public.message_reports
SET public_id = 'RPT-' || lpad(nextval('public.message_reports_public_id_seq')::text, 6, '0')
WHERE public_id IS NULL OR public_id = '';

-- 2) messages: hide-by-admin support
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages"
ON public.messages FOR SELECT
TO public
USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can hide messages" ON public.messages;
CREATE POLICY "Admins can hide messages"
ON public.messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Profanity guard trigger on messages
CREATE OR REPLACE FUNCTION public.normalize_for_profanity(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    lower(translate(coalesce(input,''),
      'ăâîșşțţĂÂÎȘŞȚŢ',
      'aaisstaaaisstt')),
    '[^a-z0-9]+', '', 'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.check_message_profanity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
  bad text;
  bad_words text[] := ARRAY[
    'pula','pizda','pizdamatii','muie','muiest','futui','futute','futai','fut',
    'cacat','curva','curve','boule','prost','proasta','idiot','idioata',
    'cretin','cretina','dobitoc','dobitoaca','tampit','tampita','jegos','jegoasa',
    'pulamea','tarfa','tarfe','nesimtit','nesimtita',
    'handicapat','retardat','retardata','futumati','futinetamati','matiitifutu',
    'panarama','labagiu','labagioaica','cocalar','tigan','tiganca','jidan',
    'teomor','teamenit','teameninti',
    'fuck','fucker','fucking','motherfucker','shit','bullshit','bitch','bitches',
    'asshole','pussy','cunt','whore','slut','retard','retarded',
    'faggot','nigger','kike'
  ];
BEGIN
  IF NEW.content IS NULL OR length(NEW.content) = 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  norm := public.normalize_for_profanity(NEW.content);

  FOREACH bad IN ARRAY bad_words LOOP
    IF position(bad IN norm) > 0 THEN
      RAISE EXCEPTION 'PROFANITY_BLOCKED: message contains forbidden language'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_profanity_guard ON public.messages;
CREATE TRIGGER trg_messages_profanity_guard
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_message_profanity();

-- 4) banned_identifiers
CREATE TABLE IF NOT EXISTS public.banned_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text NOT NULL CHECK (identifier_type IN ('email','phone')),
  value text NOT NULL,
  reason text,
  banned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier_type, value)
);

ALTER TABLE public.banned_identifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage banned identifiers" ON public.banned_identifiers;
CREATE POLICY "Admins manage banned identifiers"
ON public.banned_identifiers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Extend admin notification summary with pending_reports
DROP FUNCTION IF EXISTS public.get_admin_notification_summary();

CREATE OR REPLACE FUNCTION public.get_admin_notification_summary()
RETURNS TABLE(
  unread_total bigint,
  pending_kyc bigint,
  pending_products bigint,
  open_tickets bigint,
  pending_withdrawals bigint,
  unread_high_priority bigint,
  pending_cancellations bigint,
  pending_reports bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false),
    (SELECT COUNT(*) FROM kyc_cases WHERE status IN ('SUBMITTED', 'NEEDS_MANUAL_REVIEW')),
    (SELECT COUNT(*) FROM products WHERE approval_status = 'pending'),
    (SELECT COUNT(*) FROM ops_tickets
       WHERE status NOT IN ('CLOSED', 'RESOLVED')
         AND (last_admin_read_at IS NULL OR last_admin_read_at < updated_at)),
    (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'),
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false AND priority = 'high'),
    (SELECT COUNT(*) FROM rentals WHERE cancel_request_status = 'pending'),
    (SELECT COUNT(*) FROM message_reports WHERE resolved = false);
END;
$function$;
