
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

  IF NEW.owner_signed_at IS NOT NULL
     AND NEW.renter_signed_at IS NOT NULL
  THEN
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

DROP TRIGGER IF EXISTS trg_pv_handover_progress ON public.rental_pv_documents;
CREATE TRIGGER trg_pv_handover_progress
AFTER UPDATE ON public.rental_pv_documents
FOR EACH ROW
EXECUTE FUNCTION public.tg_pv_handover_progress();
