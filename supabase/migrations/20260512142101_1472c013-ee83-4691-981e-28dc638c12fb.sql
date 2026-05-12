CREATE OR REPLACE FUNCTION public.tg_rental_auto_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_key text;
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.payment_status = 'authorized'
     AND NEW.payment_intent_id IS NOT NULL THEN

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key'
    LIMIT 1;

    IF v_key IS NULL THEN
      RAISE LOG 'tg_rental_auto_capture: no service role key in vault';
      RETURN NEW;
    END IF;

    PERFORM net.http_post(
      url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/capture-rental-payment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object('rental_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;