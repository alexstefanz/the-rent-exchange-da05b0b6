CREATE OR REPLACE FUNCTION public.count_special_chars(_t text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*) FROM regexp_matches(_t, '[^[:alnum:][:space:].,!?;:\-''"()…–]', 'g')),
    0
  )::int;
$$;