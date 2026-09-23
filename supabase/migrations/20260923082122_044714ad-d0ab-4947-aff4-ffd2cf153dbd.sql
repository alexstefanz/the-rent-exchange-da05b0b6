CREATE OR REPLACE FUNCTION public.notify_rental_event_async(
  _rental_id uuid,
  _event_key text,
  _actor_id uuid DEFAULT NULL::uuid,
  _extra jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  fn_url text := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/notify-rental-event';
  svc_key text;
BEGIN
  SELECT decrypted_secret INTO svc_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF svc_key IS NULL THEN
    RAISE LOG 'notify_rental_event_async: no service role key in vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey', svc_key,
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object(
      'rental_id', _rental_id,
      'event_key', _event_key,
      'actor_id', _actor_id,
      'extra', _extra
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_rental_event_async failed: %', SQLERRM;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_rental_event_async(uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invoke_edge_function_async(_fn_name text, _body jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  svc_key text;
BEGIN
  SELECT decrypted_secret INTO svc_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF svc_key IS NULL THEN
    RAISE LOG 'invoke_edge_function_async: no service role key in vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/' || _fn_name,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey', svc_key,
      'Authorization', 'Bearer ' || svc_key
    ),
    body := _body
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'invoke_edge_function_async(%) failed: %', _fn_name, SQLERRM;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.invoke_edge_function_async(text, jsonb) FROM PUBLIC, anon, authenticated;

SELECT cron.alter_job(8, command := $cmd$SELECT public.invoke_edge_function_async('ops-tickets-cron', '{}'::jsonb);$cmd$);