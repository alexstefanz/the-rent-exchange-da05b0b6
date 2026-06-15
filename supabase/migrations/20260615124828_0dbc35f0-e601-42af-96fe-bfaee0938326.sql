CREATE OR REPLACE FUNCTION public.enforce_ticket_antispam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := NEW.requester_user_id;
  v_daily_limit int := 1;
  v_open_limit int := 10;
  v_dup_window_min int := 10;
  v_count int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- 1) Daily limit: max 1 ticket per 24h
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND created_at > now() - interval '24 hours';
  IF v_count >= v_daily_limit THEN
    RAISE EXCEPTION 'ANTISPAM_DAILY:%', v_daily_limit
      USING HINT = 'Ați atins limita zilnică de tichete.';
  END IF;

  -- 2) Max open tickets
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND status IN ('NEW','OPEN','IN_PROGRESS');
  IF v_count >= v_open_limit THEN
    RAISE EXCEPTION 'ANTISPAM_OPEN_LIMIT:%', v_open_limit
      USING HINT = 'Aveți prea multe tichete deschise.';
  END IF;

  -- 3) Duplicate title within last 10 minutes
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND lower(btrim(title)) = lower(btrim(NEW.title))
    AND created_at > now() - (v_dup_window_min || ' minutes')::interval;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ANTISPAM_DUPLICATE:%', v_dup_window_min
      USING HINT = 'Tichet duplicat detectat.';
  END IF;

  RETURN NEW;
END;
$$;