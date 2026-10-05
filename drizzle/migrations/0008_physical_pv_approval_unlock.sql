CREATE OR REPLACE FUNCTION public.apply_physical_pv_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.phase = 'handover' THEN
      UPDATE public.rentals
         SET handover_confirmed_at = now(),
             status = CASE WHEN status IN ('confirmed','paid','pending_handover') THEN 'active' ELSE status END
       WHERE id = NEW.rental_id AND handover_confirmed_at IS NULL;
    ELSIF NEW.phase = 'return' THEN
      UPDATE public.rentals
         SET return_confirmed_at = now(),
             status = CASE WHEN status = 'active' THEN 'completed' ELSE status END
       WHERE id = NEW.rental_id AND return_confirmed_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_physical_pv_approval ON public.rental_physical_pvs;
CREATE TRIGGER trg_apply_physical_pv_approval
  AFTER UPDATE OF status ON public.rental_physical_pvs
  FOR EACH ROW EXECUTE FUNCTION public.apply_physical_pv_approval();