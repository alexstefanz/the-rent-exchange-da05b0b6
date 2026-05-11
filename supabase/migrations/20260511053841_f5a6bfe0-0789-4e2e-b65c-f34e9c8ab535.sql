
-- Helper: async fire-and-forget notification dispatcher.
-- Calls notify-rental-event edge function via pg_net.
CREATE OR REPLACE FUNCTION public.notify_rental_event_async(
  _rental_id uuid,
  _event_key text,
  _actor_id uuid DEFAULT NULL,
  _extra jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/notify-rental-event';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZmZ5ZWNhc3R1ZGFqbWdyY2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDA0NzIsImV4cCI6MjA4MjcxNjQ3Mn0.pdlhN1E_CWT2SQMWllEm349kxqfkGwzs30R41Jnofw4';
BEGIN
  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey', anon_key,
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'rental_id', _rental_id,
      'event_key', _event_key,
      'actor_id', _actor_id,
      'extra', _extra
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Never break the host transaction because of a missed notification.
  RAISE WARNING 'notify_rental_event_async failed: %', SQLERRM;
END;
$$;

-- Trigger on rentals: detect status / handover / return / completion transitions.
CREATE OR REPLACE FUNCTION public.rentals_notify_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handover confirmed (PV pickup completed by both, gate passed).
  IF NEW.handover_confirmed_at IS NOT NULL AND OLD.handover_confirmed_at IS NULL THEN
    PERFORM public.notify_rental_event_async(NEW.id, 'handover_confirmed', NULL, '{}'::jsonb);
  END IF;

  -- Status transition into "active" (rental period started).
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    PERFORM public.notify_rental_event_async(NEW.id, 'active_rental_started', NULL, '{}'::jsonb);
  END IF;

  -- Status transition into "return_pending" (return phase opens → both must do return PV).
  IF NEW.status = 'return_pending' AND OLD.status IS DISTINCT FROM 'return_pending' THEN
    PERFORM public.notify_rental_event_async(NEW.id, 'return_in_progress', NULL, '{}'::jsonb);
    PERFORM public.notify_rental_event_async(NEW.id, 'pv_return_pending', NULL, '{}'::jsonb);
  END IF;

  -- Rental completed (return confirmed AND status flipped to completed).
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM public.notify_rental_event_async(NEW.id, 'rental_completed', NULL, '{}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rentals_notify_status ON public.rentals;
CREATE TRIGGER trg_rentals_notify_status
  AFTER UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.rentals_notify_status();

-- Trigger on inspections: fire "pv_*_completed_by_party" when first party submits;
-- when both parties submit a phase, the rentals trigger above handles handover/return.
CREATE OR REPLACE FUNCTION public.inspections_notify_party()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_count int;
  ev text;
BEGIN
  SELECT COUNT(*) INTO other_count
    FROM rental_inspections
   WHERE rental_id = NEW.rental_id
     AND phase = NEW.phase
     AND role <> NEW.role;

  -- Only fire the "completed by party" notification when this party is FIRST.
  -- The second party will be notified by the rentals status trigger instead.
  IF other_count = 0 THEN
    ev := CASE WHEN NEW.phase = 'checkout' THEN 'pv_pickup_completed_by_party'
               ELSE 'pv_return_completed_by_party' END;
    PERFORM public.notify_rental_event_async(
      NEW.rental_id,
      ev,
      NEW.user_id,
      jsonb_build_object('phase', NEW.phase, 'actorRole', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspections_notify_party ON public.rental_inspections;
CREATE TRIGGER trg_inspections_notify_party
  AFTER INSERT ON public.rental_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.inspections_notify_party();
