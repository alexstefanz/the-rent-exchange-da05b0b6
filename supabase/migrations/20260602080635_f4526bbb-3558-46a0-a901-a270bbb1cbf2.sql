CREATE OR REPLACE FUNCTION public.close_user_ticket(p_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT requester_user_id, status
    INTO v_owner, v_status
  FROM public.ops_tickets
  WHERE id = p_ticket_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF v_owner <> v_uid THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF v_status IN ('CLOSED', 'RESOLVED') THEN
    RETURN;
  END IF;

  UPDATE public.ops_tickets
     SET status = 'CLOSED',
         closed_at = now(),
         updated_at = now()
   WHERE id = p_ticket_id;

  INSERT INTO public.ops_ticket_messages (ticket_id, author_type, author_id, message_text, is_internal)
  VALUES (p_ticket_id, 'SYSTEM', v_uid, 'Tichet închis de client.', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_user_ticket(uuid) TO authenticated;