CREATE OR REPLACE FUNCTION public.tg_pv_handover_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phase <> 'handover' THEN
    RETURN NEW;
  END IF;

  -- Signing the handover PV by BOTH parties confirms the physical handover.
  IF NEW.owner_signed_at IS NOT NULL
     AND NEW.renter_signed_at IS NOT NULL
  THEN
    PERFORM set_config('app.bypass_renter_lock', 'on', true);
    UPDATE public.rentals
    SET handover_confirmed_at = COALESCE(handover_confirmed_at, now()),
        status = CASE
          WHEN status IN ('completed','cancelled','rejected','active') THEN status
          ELSE 'active'
        END
    WHERE id = NEW.rental_id
      AND handover_confirmed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;