
-- ============================================================================
-- AUTO-ASSIGN: pick best admin for a ticket based on category specialization
-- ============================================================================
CREATE OR REPLACE FUNCTION public.pick_admin_for_ticket_category(p_group text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid;
BEGIN
  -- 1) Try specialized admins, pick one with fewest OPEN tickets
  SELECT s.user_id INTO v_admin
  FROM public.admin_specializations s
  WHERE s.category_group = p_group
    AND public.has_role(s.user_id, 'admin'::app_role)
  ORDER BY (
    SELECT COUNT(*) FROM public.ops_tickets t
    WHERE t.assigned_to = s.user_id
      AND t.status IN ('NEW','IN_PROGRESS','WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL')
  ) ASC, random()
  LIMIT 1;

  IF v_admin IS NOT NULL THEN
    RETURN v_admin;
  END IF;

  -- 2) Fallback: any admin with fewest OPEN tickets
  SELECT ur.user_id INTO v_admin
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role
  ORDER BY (
    SELECT COUNT(*) FROM public.ops_tickets t
    WHERE t.assigned_to = ur.user_id
      AND t.status IN ('NEW','IN_PROGRESS','WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL')
  ) ASC, random()
  LIMIT 1;

  RETURN v_admin;
END;
$$;

-- Trigger: on ticket creation, auto-assign if not assigned
CREATE OR REPLACE FUNCTION public.auto_assign_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid;
BEGIN
  IF NEW.assigned_to IS NULL AND NEW.category_group IS NOT NULL THEN
    v_admin := public.pick_admin_for_ticket_category(NEW.category_group);
    IF v_admin IS NOT NULL THEN
      NEW.assigned_to := v_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_ticket ON public.ops_tickets;
CREATE TRIGGER trg_auto_assign_ticket
BEFORE INSERT ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_ticket();

-- Audit log entry after auto-assign
CREATE OR REPLACE FUNCTION public.log_auto_assign_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.ops_ticket_audit_log (ticket_id, actor_id, action, new_value)
    VALUES (NEW.id, NULL, 'auto_assigned', NEW.assigned_to::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_auto_assign_ticket ON public.ops_tickets;
CREATE TRIGGER trg_log_auto_assign_ticket
AFTER INSERT ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.log_auto_assign_ticket();

-- ============================================================================
-- ANALYTICS: aggregated support metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_support_analytics(
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to   timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Restrict to admins
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH base AS (
    SELECT * FROM public.ops_tickets
    WHERE created_at >= p_from AND created_at < p_to
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'NEW')::int AS new_count,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress_count,
      COUNT(*) FILTER (WHERE status IN ('WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL'))::int AS waiting_count,
      COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_count,
      COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed_count,
      COUNT(*) FILTER (WHERE assigned_to IS NULL)::int AS unassigned_count
    FROM base
  ),
  by_priority AS (
    SELECT jsonb_object_agg(priority, c) AS data
    FROM (SELECT priority, COUNT(*)::int AS c FROM base GROUP BY priority) x
  ),
  by_category AS (
    SELECT jsonb_object_agg(COALESCE(category_group,'unknown'), c) AS data
    FROM (SELECT category_group, COUNT(*)::int AS c FROM base GROUP BY category_group) x
  ),
  first_response AS (
    SELECT AVG(EXTRACT(EPOCH FROM (m.first_admin_at - t.created_at))/60.0) AS avg_minutes
    FROM base t
    JOIN LATERAL (
      SELECT MIN(created_at) AS first_admin_at
      FROM public.ops_ticket_messages
      WHERE ticket_id = t.id AND author_type <> 'CUSTOMER' AND is_internal = false
    ) m ON true
    WHERE m.first_admin_at IS NOT NULL
  ),
  resolution AS (
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600.0) AS avg_hours
    FROM base
    WHERE closed_at IS NOT NULL
  ),
  sla AS (
    SELECT COUNT(*)::int AS breach_count
    FROM base t
    LEFT JOIN LATERAL (
      SELECT MIN(created_at) AS first_admin_at
      FROM public.ops_ticket_messages
      WHERE ticket_id = t.id AND author_type <> 'CUSTOMER' AND is_internal = false
    ) m ON true
    WHERE
      (t.priority = 'CRITICAL' AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '1 hour')
      OR (t.priority = 'HIGH'  AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '8 hours')
      OR (t.priority = 'MEDIUM'AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '24 hours')
      OR (t.priority = 'LOW'   AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '72 hours')
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('day', day, 'created', created_count, 'resolved', resolved_count) ORDER BY day) AS data
    FROM (
      SELECT
        d::date AS day,
        COUNT(*) FILTER (WHERE created_at::date = d::date)::int AS created_count,
        COUNT(*) FILTER (WHERE closed_at::date = d::date)::int AS resolved_count
      FROM generate_series(p_from::date, (p_to - interval '1 day')::date, interval '1 day') d
      LEFT JOIN base ON created_at::date = d::date OR closed_at::date = d::date
      GROUP BY d
    ) x
  ),
  by_admin AS (
    SELECT jsonb_agg(jsonb_build_object(
      'admin_id', assigned_to,
      'name', COALESCE(p.full_name, p.email, 'N/A'),
      'open', open_count,
      'resolved', resolved_count,
      'total', total_count
    )) AS data
    FROM (
      SELECT
        assigned_to,
        COUNT(*) FILTER (WHERE status IN ('NEW','IN_PROGRESS','WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL'))::int AS open_count,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED','CLOSED'))::int AS resolved_count,
        COUNT(*)::int AS total_count
      FROM base
      WHERE assigned_to IS NOT NULL
      GROUP BY assigned_to
    ) a
    LEFT JOIN public.profiles p ON p.id = a.assigned_to
  )
  SELECT jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    'totals', (SELECT row_to_json(totals) FROM totals),
    'by_priority', COALESCE((SELECT data FROM by_priority), '{}'::jsonb),
    'by_category', COALESCE((SELECT data FROM by_category), '{}'::jsonb),
    'avg_first_response_minutes', (SELECT avg_minutes FROM first_response),
    'avg_resolution_hours', (SELECT avg_hours FROM resolution),
    'sla_breach_count', (SELECT breach_count FROM sla),
    'daily', COALESCE((SELECT data FROM daily), '[]'::jsonb),
    'by_admin', COALESCE((SELECT data FROM by_admin), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_support_analytics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pick_admin_for_ticket_category(text) TO authenticated;
