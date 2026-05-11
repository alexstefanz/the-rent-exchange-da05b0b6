-- Update ticket notification triggers to include ticket id in link
CREATE OR REPLACE FUNCTION public.notify_user_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.requester_user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.requester_user_id,
      'ticket_created',
      'Tichet creat: ' || NEW.public_id,
      'Ticket created: ' || NEW.public_id,
      'Solicitarea ta a fost înregistrată. Îți răspundem cât mai curând.',
      'Your request has been logged. We will reply as soon as possible.',
      '/suport?open=' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_user_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester uuid;
  v_public_id text;
  v_ticket_id uuid;
BEGIN
  IF NEW.author_type = 'ADMIN' AND COALESCE(NEW.is_internal, false) = false THEN
    SELECT id, requester_user_id, public_id INTO v_ticket_id, v_requester, v_public_id
    FROM public.ops_tickets WHERE id = NEW.ticket_id;

    IF v_requester IS NOT NULL THEN
      PERFORM public.create_user_notification(
        v_requester,
        'ticket_replied',
        'Răspuns la tichet ' || COALESCE(v_public_id, ''),
        'New reply on ticket ' || COALESCE(v_public_id, ''),
        LEFT(NEW.message_text, 140),
        LEFT(NEW.message_text, 140),
        '/suport?open=' || v_ticket_id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_user_ticket_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('RESOLVED','CLOSED') AND OLD.status IS DISTINCT FROM NEW.status AND NEW.requester_user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.requester_user_id,
      'ticket_resolved',
      'Tichet rezolvat: ' || NEW.public_id,
      'Ticket resolved: ' || NEW.public_id,
      'Tichetul tău a fost marcat ca rezolvat. Dacă mai ai întrebări, deschide-l din nou.',
      'Your ticket has been resolved. Reopen it if you have more questions.',
      '/suport?open=' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;