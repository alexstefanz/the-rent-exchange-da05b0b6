CREATE OR REPLACE FUNCTION public.enforce_ticket_antispam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := NEW.requester_user_id;
  v_cooldown_sec int := 60;
  v_hourly_limit int := 5;
  v_daily_limit int := 15;
  v_open_limit int := 10;
  v_dup_window_min int := 10;
  v_count int;
  v_last_at timestamptz;
  v_secs_since int;
BEGIN
  -- Skip if no requester (system-generated) or if caller is admin
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- 1) Cooldown between consecutive tickets
  SELECT MAX(created_at) INTO v_last_at
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid;

  IF v_last_at IS NOT NULL THEN
    v_secs_since := EXTRACT(EPOCH FROM (now() - v_last_at))::int;
    IF v_secs_since < v_cooldown_sec THEN
      RAISE EXCEPTION 'ANTISPAM_COOLDOWN:%', (v_cooldown_sec - v_secs_since)
        USING HINT = 'Așteptați înainte de a deschide un alt tichet.';
    END IF;
  END IF;

  -- 2) Hourly limit
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND created_at > now() - interval '1 hour';
  IF v_count >= v_hourly_limit THEN
    RAISE EXCEPTION 'ANTISPAM_HOURLY:%', v_hourly_limit
      USING HINT = 'Ați atins limita orară de tichete.';
  END IF;

  -- 3) Daily limit
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND created_at > now() - interval '24 hours';
  IF v_count >= v_daily_limit THEN
    RAISE EXCEPTION 'ANTISPAM_DAILY:%', v_daily_limit
      USING HINT = 'Ați atins limita zilnică de tichete.';
  END IF;

  -- 4) Max open tickets
  SELECT COUNT(*) INTO v_count
  FROM public.ops_tickets
  WHERE requester_user_id = v_uid
    AND status IN ('NEW','OPEN','IN_PROGRESS');
  IF v_count >= v_open_limit THEN
    RAISE EXCEPTION 'ANTISPAM_OPEN_LIMIT:%', v_open_limit
      USING HINT = 'Aveți prea multe tichete deschise.';
  END IF;

  -- 5) Duplicate title within last 10 minutes
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

DROP TRIGGER IF EXISTS trg_enforce_ticket_antispam ON public.ops_tickets;
CREATE TRIGGER trg_enforce_ticket_antispam
  BEFORE INSERT ON public.ops_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ticket_antispam();