ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS renter_seen_confirmation boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_rentals_renter_unseen_confirmed
  ON public.rentals (renter_id)
  WHERE status = 'confirmed' AND renter_seen_confirmation = false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rentals'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals';
  END IF;
END $$;

ALTER TABLE public.rentals REPLICA IDENTITY FULL;