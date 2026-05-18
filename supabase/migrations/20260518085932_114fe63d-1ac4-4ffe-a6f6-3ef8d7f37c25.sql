
CREATE TABLE IF NOT EXISTS public.anaf_cache (
  cui TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anaf_cache ENABLE ROW LEVEL SECURITY;

-- Deny-by-default: no client policies. Only service role (edge function) can read/write.
CREATE INDEX IF NOT EXISTS idx_anaf_cache_fetched_at ON public.anaf_cache (fetched_at);
