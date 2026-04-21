-- 1. Function to mark a ticket as read by admin
CREATE OR REPLACE FUNCTION public.mark_ops_ticket_read(p_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can mark tickets as read';
  END IF;

  UPDATE public.ops_tickets
  SET last_admin_read_at = now()
  WHERE id = p_ticket_id;
END;
$$;

-- 2. Update notification summary to count only unread tickets
CREATE OR REPLACE FUNCTION public.get_admin_notification_summary()
 RETURNS TABLE(unread_total bigint, pending_kyc bigint, pending_products bigint, open_tickets bigint, pending_withdrawals bigint, unread_high_priority bigint)
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
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false AND priority = 'high');
END;
$function$;

-- 3. Trigger to bump ops_tickets.updated_at when a new message arrives
CREATE OR REPLACE FUNCTION public.bump_ops_ticket_updated_at_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only bump for non-internal messages (user-visible activity)
  IF COALESCE(NEW.is_internal, false) = false THEN
    UPDATE public.ops_tickets
    SET updated_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_ops_ticket_updated_at_on_message ON public.ops_ticket_messages;
CREATE TRIGGER trg_bump_ops_ticket_updated_at_on_message
AFTER INSERT ON public.ops_ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.bump_ops_ticket_updated_at_on_message();