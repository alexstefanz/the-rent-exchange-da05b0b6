ALTER TABLE public.rentals 
  ADD COLUMN IF NOT EXISTS handover_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_rentals_active_end_date 
  ON public.rentals(end_date) 
  WHERE status = 'active';