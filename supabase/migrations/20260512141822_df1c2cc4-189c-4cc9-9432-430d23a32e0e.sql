CREATE OR REPLACE FUNCTION public.tg_rental_auto_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.payment_status = 'authorized'
     AND NEW.payment_intent_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/capture-rental-payment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZmZ5ZWNhc3R1ZGFqbWdyY2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDA0NzIsImV4cCI6MjA4MjcxNjQ3Mn0.pdlhN1E_CWT2SQMWllEm349kxqfkGwzs30R41Jnofw4'
      ),
      body := jsonb_build_object('rental_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rental_auto_capture ON public.rentals;

CREATE TRIGGER trg_rental_auto_capture
AFTER UPDATE ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.tg_rental_auto_capture();