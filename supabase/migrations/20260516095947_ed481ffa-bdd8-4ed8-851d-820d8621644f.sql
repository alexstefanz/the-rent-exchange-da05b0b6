
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS early_return_new_end_date date,
  ADD COLUMN IF NOT EXISTS early_return_initiator uuid,
  ADD COLUMN IF NOT EXISTS early_return_renter_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_return_owner_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_return_new_subtotal numeric(10,2),
  ADD COLUMN IF NOT EXISTS early_return_new_rental_days int;

CREATE INDEX IF NOT EXISTS idx_rentals_early_return_pending
  ON public.rentals (early_return_status)
  WHERE early_return_status = 'pending';

CREATE OR REPLACE FUNCTION public.validate_early_return_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.early_return_new_end_date IS NOT NULL THEN
    IF NEW.early_return_new_end_date <= NEW.start_date OR NEW.early_return_new_end_date >= NEW.end_date THEN
      RAISE EXCEPTION 'early_return_new_end_date must be strictly between start_date and end_date';
    END IF;
  END IF;

  IF NEW.early_return_initiator IS NOT NULL THEN
    IF NEW.early_return_initiator <> NEW.renter_id AND NEW.early_return_initiator <> NEW.owner_id THEN
      RAISE EXCEPTION 'early_return_initiator must be the renter or the owner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_early_return ON public.rentals;
CREATE TRIGGER trg_validate_early_return
  BEFORE INSERT OR UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_early_return_request();
