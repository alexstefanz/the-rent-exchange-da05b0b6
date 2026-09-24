DO $$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef('public.enforce_ticket_antispam()'::regprocedure) INTO v_def;
  v_def := replace(v_def, 'v_daily_limit int := 1;', 'v_daily_limit int := 5;');
  v_def := replace(v_def, 'max 1 ticket per 24h', 'max 5 tickets per 24h');
  EXECUTE v_def;
END $$;