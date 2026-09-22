CREATE OR REPLACE FUNCTION public.block_contact_info_in_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
  v_compact text;
  v_paid boolean := false;
BEGIN
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  v_text := COALESCE(NEW.content, '');

  IF v_text ~* '^https?://' THEN
    RETURN NEW;
  END IF;

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

  -- Remove only characters commonly used INSIDE a phone number, so digits from
  -- separate words (prices, dates) are not concatenated into a false positive.
  v_compact := regexp_replace(v_text, '[[:space:]()./-]', '', 'g');

  IF v_compact ~ '(\+?4?0[0-9]{8,})|([0-9]{9,})' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  IF v_text ~* '[[:alnum:]._%+-]+[[:space:]]*(@|\(at\)|\[at\]|[[:space:]]at[[:space:]])[[:space:]]*[[:alnum:].-]+[[:space:]]*(\.|\(dot\)|\[dot\]|[[:space:]]dot[[:space:]])[[:space:]]*[[:alpha:]]{2,}' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  IF v_text ~* '(https?://|www\.|[[:alnum:]-]+\.(ro|com|net|org|eu|info|biz|io|co)\b)' THEN
    RAISE EXCEPTION 'CONTACT_INFO_BLOCKED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.block_contact_info_in_chat() FROM PUBLIC, anon, authenticated;