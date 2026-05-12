-- 1. Resolve duplicate active renter-cancel tickets, keeping the oldest one
WITH ranked AS (
  SELECT id,
         reservation_id,
         requester_user_id,
         category_type,
         ROW_NUMBER() OVER (
           PARTITION BY reservation_id, requester_user_id, category_type
           ORDER BY created_at ASC
         ) AS rn
  FROM public.ops_tickets
  WHERE 'renter-cancel' = ANY(tags)
    AND status IN ('NEW', 'OPEN', 'IN_PROGRESS')
    AND reservation_id IS NOT NULL
    AND requester_user_id IS NOT NULL
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
UPDATE public.ops_tickets t
SET status = 'RESOLVED',
    closed_at = now()
FROM dupes
WHERE t.id = dupes.id;

-- 2. Add an internal audit message on each closed duplicate
INSERT INTO public.ops_ticket_messages (ticket_id, author_type, author_id, is_internal, message_text)
SELECT t.id, 'SYSTEM', NULL, true,
       'Tichet închis automat ca duplicat al unui tichet activ existent pentru aceeași rezervare și același motiv (renter-cancel).'
FROM public.ops_tickets t
WHERE 'renter-cancel' = ANY(t.tags)
  AND t.status = 'RESOLVED'
  AND t.closed_at >= now() - interval '1 minute';

-- 3. Helper index
CREATE INDEX IF NOT EXISTS idx_ops_tickets_reservation_tags_status
  ON public.ops_tickets (reservation_id, status)
  WHERE 'renter-cancel' = ANY(tags);

-- 4. Unique partial index preventing future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ops_tickets_active_renter_cancel
  ON public.ops_tickets (reservation_id, requester_user_id, category_type)
  WHERE 'renter-cancel' = ANY(tags)
    AND status IN ('NEW', 'OPEN', 'IN_PROGRESS');