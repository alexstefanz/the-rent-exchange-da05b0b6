ALTER TABLE public.rentals REPLICA IDENTITY FULL;
ALTER TABLE public.rental_pv_documents REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_pv_documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;