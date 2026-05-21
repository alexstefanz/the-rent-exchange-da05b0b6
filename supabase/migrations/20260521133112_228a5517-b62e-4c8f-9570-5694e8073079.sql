ALTER TABLE public.kyc_cases REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_cases;