ALTER TABLE public.ops_tickets
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached_at timestamptz;

UPDATE public.ops_tickets SET sla_due_at = created_at + interval '48 hours' WHERE sla_due_at IS NULL;

ALTER TABLE public.ops_tickets ALTER COLUMN sla_due_at SET DEFAULT (now() + interval '48 hours');

-- Backfill first_response_at from existing non-internal agent/admin messages
UPDATE public.ops_tickets t
SET first_response_at = m.first_at
FROM (
  SELECT ticket_id, MIN(created_at) AS first_at
  FROM public.ops_ticket_messages
  WHERE COALESCE(is_internal, false) = false
    AND author_type IN ('AGENT','ADMIN','SUPPORT')
  GROUP BY ticket_id
) m
WHERE m.ticket_id = t.id AND t.first_response_at IS NULL;

CREATE OR REPLACE FUNCTION public.mark_ticket_first_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_internal, false) = false
     AND NEW.author_type IN ('AGENT','ADMIN','SUPPORT') THEN
    UPDATE public.ops_tickets
       SET first_response_at = COALESCE(first_response_at, NEW.created_at)
     WHERE id = NEW.ticket_id
       AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_ticket_first_response ON public.ops_ticket_messages;
CREATE TRIGGER trg_mark_ticket_first_response
AFTER INSERT ON public.ops_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.mark_ticket_first_response();

CREATE INDEX IF NOT EXISTS idx_ops_tickets_sla_due_at ON public.ops_tickets (sla_due_at) WHERE first_response_at IS NULL;