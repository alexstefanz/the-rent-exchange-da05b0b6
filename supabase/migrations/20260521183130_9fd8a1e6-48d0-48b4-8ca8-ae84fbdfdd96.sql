
CREATE OR REPLACE FUNCTION public.count_special_chars(_t text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*) FROM regexp_matches(_t, '[^\p{L}\p{N}\s.,!?;:\-''"()…–]', 'g')),
    0
  )::int;
$$;

CREATE OR REPLACE FUNCTION public.enforce_chat_text_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_text text;
BEGIN
  IF TG_TABLE_NAME = 'messages' THEN
    -- Skip system messages
    IF NEW.message_type = 'system' THEN
      RETURN NEW;
    END IF;
    v_text := NEW.content;
  ELSE
    v_text := NEW.message_text;
  END IF;

  IF v_text IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow attachment URLs (image/file uploads) untouched
  IF v_text ~* '^https?://' THEN
    RETURN NEW;
  END IF;

  IF char_length(v_text) > 500 THEN
    RAISE EXCEPTION 'MESSAGE_TOO_LONG' USING ERRCODE = 'check_violation';
  END IF;

  IF public.count_special_chars(v_text) > 20 THEN
    RAISE EXCEPTION 'TOO_MANY_SPECIAL_CHARS' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_enforce_limits ON public.messages;
CREATE TRIGGER trg_messages_enforce_limits
BEFORE INSERT OR UPDATE OF content ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chat_text_limits();

DROP TRIGGER IF EXISTS trg_ops_ticket_messages_enforce_limits ON public.ops_ticket_messages;
CREATE TRIGGER trg_ops_ticket_messages_enforce_limits
BEFORE INSERT OR UPDATE OF message_text ON public.ops_ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chat_text_limits();
