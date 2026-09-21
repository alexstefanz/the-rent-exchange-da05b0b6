CREATE OR REPLACE FUNCTION public.block_contact_info_in_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
  v_paid boolean := false;
BEGIN
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  v_text := COALESCE(NEW.content, '');

  -- Attachment URLs (uploads) are produced by the app, not typed by the user.
  IF v_text ~* '^https?://' THEN
    RETURN NEW;
  END IF;

  -- Contact sharing is allowed once the rental attached to this conversation is paid.
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.rentals r ON r.id = c.rentals_id
    WHERE c.id = NEW.conversation_id
      AND r.payment_status IN ('authorized','paid','captured')
  ) INTO v_paid;

  IF v_paid THEN
    RETURN NEW;
  END IF;

  -- Phone numbers (incl. spaced/dotted/dashed digits, RO and international)
  IF regexp_replace(v_text, '[^0-9+]', '', 'g') ~ '(\+?4?0[0-9]{9})|([0-9]{9,})' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  -- Email addresses, incl. obfuscated forms
  IF v_text ~* '[[:alnum:]._%+-]+[[:space:]]*(@|\(at\)|\[at\]|[[:space:]]at[[:space:]])[[:space:]]*[[:alnum:].-]+[[:space:]]*(\.|\(dot\)|\[dot\]|[[:space:]]dot[[:space:]])[[:space:]]*[[:alpha:]]{2,}' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  -- Links / domains and messaging handles
  IF v_text ~* '(https?://|www\.|[[:alnum:]-]+\.(ro|com|net|org|eu|info|biz|io|co)\b)' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_block_contact_info ON public.messages;
CREATE TRIGGER trg_messages_block_contact_info
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.block_contact_info_in_chat();

REVOKE ALL ON FUNCTION public.block_contact_info_in_chat() FROM PUBLIC, anon, authenticated;