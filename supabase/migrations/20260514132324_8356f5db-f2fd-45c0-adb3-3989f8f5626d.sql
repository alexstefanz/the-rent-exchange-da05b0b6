DROP FUNCTION IF EXISTS public.get_admin_notification_summary();

CREATE OR REPLACE FUNCTION public.notify_admin_cancellation_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_title text;
  v_initiator_name text;
  v_rental_code text;
BEGIN
  IF NEW.cancel_request_status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.cancel_request_status IS NOT DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;
  SELECT full_name INTO v_initiator_name FROM public.profiles WHERE id = NEW.cancel_request_initiator;
  v_rental_code := COALESCE(NEW.public_id, ('#' || substr(NEW.id::text, 1, 8)));

  INSERT INTO public.admin_notifications
    (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
  VALUES (
    'cancellation_requested',
    'Cerere de anulare nouă',
    'New cancellation request',
    COALESCE(v_initiator_name, 'Un utilizator') || ' a solicitat anularea rezervării ' || v_rental_code
      || COALESCE(' (' || v_product_title || ')', '') || '.',
    COALESCE(v_initiator_name, 'A user') || ' requested cancellation for booking ' || v_rental_code
      || COALESCE(' (' || v_product_title || ')', '') || '.',
    '/admin/approvals?tab=cancellations',
    NEW.id,
    'rental',
    'high'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_cancellation_request ON public.rentals;
CREATE TRIGGER trg_notify_admin_cancellation_request
AFTER INSERT OR UPDATE OF cancel_request_status ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_cancellation_request();

CREATE OR REPLACE FUNCTION public.get_admin_notification_summary()
 RETURNS TABLE(unread_total bigint, pending_kyc bigint, pending_products bigint, open_tickets bigint, pending_withdrawals bigint, unread_high_priority bigint, pending_cancellations bigint)
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
    (SELECT COUNT(*) FROM rentals WHERE cancel_request_status = 'pending');
END;
$function$;

INSERT INTO public.admin_notifications
  (type, title_ro, title_en, description_ro, description_en, link, entity_id, entity_type, priority)
SELECT
  'cancellation_requested',
  'Cerere de anulare nouă',
  'New cancellation request',
  COALESCE(p.full_name, 'Un utilizator') || ' a solicitat anularea rezervării '
    || COALESCE(r.public_id, '#' || substr(r.id::text, 1, 8))
    || COALESCE(' (' || pr.title || ')', '') || '.',
  COALESCE(p.full_name, 'A user') || ' requested cancellation for booking '
    || COALESCE(r.public_id, '#' || substr(r.id::text, 1, 8))
    || COALESCE(' (' || pr.title || ')', '') || '.',
  '/admin/approvals?tab=cancellations',
  r.id,
  'rental',
  'high'
FROM public.rentals r
LEFT JOIN public.products pr ON pr.id = r.product_id
LEFT JOIN public.profiles p ON p.id = r.cancel_request_initiator
WHERE r.cancel_request_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_notifications an
    WHERE an.entity_id = r.id AND an.type = 'cancellation_requested'
  );