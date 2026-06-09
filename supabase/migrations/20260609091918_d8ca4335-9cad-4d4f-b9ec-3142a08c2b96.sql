CREATE OR REPLACE FUNCTION public.tg_pv_return_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.phase <> 'return' THEN
    RETURN NEW;
  END IF;

  -- Renter just signed -> mark return as initiated
  IF NEW.renter_signed_at IS NOT NULL
     AND (OLD.renter_signed_at IS NULL OR OLD.renter_signed_at IS DISTINCT FROM NEW.renter_signed_at)
  THEN
    PERFORM set_config('app.bypass_renter_lock', 'on', true);
    UPDATE public.rentals
    SET early_return_status = COALESCE(NULLIF(early_return_status, ''), 'initiated')
    WHERE id = NEW.rental_id
      AND (early_return_status IS NULL OR early_return_status = '' OR early_return_status = 'none');
  END IF;

  -- Owner just signed -> finalize the rental
  IF NEW.owner_signed_at IS NOT NULL
     AND (OLD.owner_signed_at IS NULL OR OLD.owner_signed_at IS DISTINCT FROM NEW.owner_signed_at)
  THEN
    PERFORM set_config('app.bypass_renter_lock', 'on', true);
    UPDATE public.rentals
    SET return_confirmed_at = COALESCE(return_confirmed_at, now()),
        completed_at = COALESCE(completed_at, now()),
        status = CASE WHEN status IN ('completed','cancelled','rejected') THEN status ELSE 'completed' END
    WHERE id = NEW.rental_id;
  END IF;

  RETURN NEW;
END;
$function$;