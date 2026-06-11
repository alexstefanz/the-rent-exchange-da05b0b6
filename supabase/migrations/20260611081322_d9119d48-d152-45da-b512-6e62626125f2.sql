-- Dedupe existing sent/delivered audit rows
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY rental_id, event_key, user_id, channel
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.notification_audit_log
  WHERE status IN ('sent','delivered')
)
DELETE FROM public.notification_audit_log a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_audit_sent
ON public.notification_audit_log(rental_id, event_key, user_id, channel)
WHERE status IN ('sent','delivered');
