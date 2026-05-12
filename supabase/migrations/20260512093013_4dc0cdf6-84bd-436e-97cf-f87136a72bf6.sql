-- 1) photos_meta column for per-uploader tracking
ALTER TABLE public.rental_pv_documents
  ADD COLUMN IF NOT EXISTS photos_meta jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: for existing rows, mark all current photos as uploaded by owner
UPDATE public.rental_pv_documents
SET photos_meta = COALESCE(
  (
    SELECT jsonb_agg(jsonb_build_object('path', p, 'role', 'owner', 'uploaded_at', now()))
    FROM unnest(photos) AS p
  ),
  '[]'::jsonb
)
WHERE jsonb_array_length(photos_meta) = 0
  AND array_length(photos, 1) > 0;

-- 2) Trigger: auto-advance rental status on return PV signatures
CREATE OR REPLACE FUNCTION public.tg_pv_return_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phase <> 'return' THEN
    RETURN NEW;
  END IF;

  -- Renter just signed -> mark return as initiated
  IF NEW.renter_signed_at IS NOT NULL
     AND (OLD.renter_signed_at IS NULL OR OLD.renter_signed_at IS DISTINCT FROM NEW.renter_signed_at)
  THEN
    UPDATE public.rentals
    SET early_return_status = COALESCE(NULLIF(early_return_status, ''), 'initiated')
    WHERE id = NEW.rental_id
      AND (early_return_status IS NULL OR early_return_status = '' OR early_return_status = 'none');
  END IF;

  -- Owner just signed -> finalize the rental
  IF NEW.owner_signed_at IS NOT NULL
     AND (OLD.owner_signed_at IS NULL OR OLD.owner_signed_at IS DISTINCT FROM NEW.owner_signed_at)
  THEN
    UPDATE public.rentals
    SET return_confirmed_at = COALESCE(return_confirmed_at, now()),
        completed_at = COALESCE(completed_at, now()),
        status = CASE WHEN status IN ('completed','cancelled','rejected') THEN status ELSE 'completed' END
    WHERE id = NEW.rental_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pv_return_progress ON public.rental_pv_documents;
CREATE TRIGGER trg_pv_return_progress
AFTER UPDATE ON public.rental_pv_documents
FOR EACH ROW
EXECUTE FUNCTION public.tg_pv_return_progress();