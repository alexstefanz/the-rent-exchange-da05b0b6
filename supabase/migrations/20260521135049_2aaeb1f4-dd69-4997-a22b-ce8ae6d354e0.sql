
-- Function: post a system "timeline" card in the rental's chat
CREATE OR REPLACE FUNCTION public.post_rental_timeline_chat_event(
  _rental_id uuid,
  _kind text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  conv_id uuid;
  prod_title text;
  day_label text;
  payload text;
  fmt_start text;
  fmt_end text;
BEGIN
  SELECT r1.id, r1.public_id, r1.product_id, r1.owner_id, r1.renter_id,
         r1.start_date, r1.end_date, r1.rental_days, r1.subtotal
    INTO r
    FROM public.rentals r1
   WHERE r1.id = _rental_id;

  IF r.id IS NULL OR r.owner_id IS NULL OR r.renter_id IS NULL OR r.product_id IS NULL THEN
    RETURN;
  END IF;

  -- find/create conversation: prefer one tied to this rental, else (product, buyer, owner)
  SELECT c.id INTO conv_id
    FROM public.conversations c
   WHERE c.rentals_id = r.id
   LIMIT 1;

  IF conv_id IS NULL THEN
    SELECT c.id INTO conv_id
      FROM public.conversations c
     WHERE c.product_id = r.product_id
       AND c.buyer_id   = r.renter_id
       AND c.owner_id   = r.owner_id
     ORDER BY c.created_at DESC
     LIMIT 1;
  END IF;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (product_id, buyer_id, owner_id, rentals_id)
    VALUES (r.product_id, r.renter_id, r.owner_id, r.id)
    RETURNING id INTO conv_id;
  END IF;

  -- idempotent: skip if same kind already posted for this rental
  IF EXISTS (
    SELECT 1 FROM public.messages m
     WHERE m.conversation_id = conv_id
       AND m.message_type = 'system'
       AND m.content LIKE (_kind || '|' || COALESCE(r.public_id, '') || '%')
  ) THEN
    RETURN;
  END IF;

  SELECT p.title INTO prod_title FROM public.products p WHERE p.id = r.product_id;
  prod_title := COALESCE(prod_title, 'produs');

  day_label := CASE WHEN r.rental_days = 1 THEN 'zi' ELSE 'zile' END;
  fmt_start := to_char(r.start_date, 'DD Mon YYYY');
  fmt_end   := to_char(r.end_date,   'DD Mon YYYY');

  payload := _kind || '|'
          || COALESCE(r.public_id, '') || '|'
          || prod_title || '|'
          || fmt_start || '|'
          || fmt_end || '|'
          || r.rental_days || ' ' || day_label || '|'
          || COALESCE(r.subtotal::text, '0') || ' RON';

  INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
  VALUES (conv_id, NULL, payload, 'system');

  UPDATE public.conversations SET updated_at = now() WHERE id = conv_id;
END;
$$;

-- Trigger function on rentals AFTER UPDATE
CREATE OR REPLACE FUNCTION public.notify_rental_chat_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- request accepted: pending -> confirmed
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'request_accepted');
  END IF;

  -- request declined: pending -> cancelled with rejection_reason
  IF NEW.status = 'cancelled' AND OLD.status = 'pending'
     AND NEW.rejection_reason IS NOT NULL THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'request_declined');
  END IF;

  -- booking cancelled (any other cancellation path)
  IF NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL
     AND NOT (OLD.status = 'pending' AND NEW.rejection_reason IS NOT NULL) THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'booking_cancelled');
  END IF;

  -- payment completed: payment_status entered authorized/captured/paid
  IF NEW.payment_status IN ('authorized','captured','paid')
     AND (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('authorized','captured','paid')) THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'payment_completed');
  END IF;

  -- handover done
  IF NEW.handover_confirmed_at IS NOT NULL AND OLD.handover_confirmed_at IS NULL THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'handover_done');
  END IF;

  -- rental completed
  IF (NEW.return_confirmed_at IS NOT NULL AND OLD.return_confirmed_at IS NULL)
     OR (NEW.status = 'completed' AND OLD.status <> 'completed') THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.id, 'rental_completed');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rental_chat_events_trg ON public.rentals;
CREATE TRIGGER rental_chat_events_trg
AFTER UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_rental_chat_event();

-- Trigger on rental_inspections: post 'return_started' when a return inspection is created
CREATE OR REPLACE FUNCTION public.notify_return_started_chat_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phase = 'return' THEN
    PERFORM public.post_rental_timeline_chat_event(NEW.rental_id, 'return_started');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rental_inspection_return_chat_trg ON public.rental_inspections;
CREATE TRIGGER rental_inspection_return_chat_trg
AFTER INSERT ON public.rental_inspections
FOR EACH ROW
EXECUTE FUNCTION public.notify_return_started_chat_event();
