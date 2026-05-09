
-- Cache for scanned URLs
CREATE TABLE public.url_scan_cache (
  url_hash TEXT PRIMARY KEY,
  normalized_url TEXT NOT NULL,
  host TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('SAFE','WARNING','BLOCKED')),
  risk_score INTEGER NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  gsb_threat TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_url_scan_cache_host ON public.url_scan_cache(host);
CREATE INDEX idx_url_scan_cache_expires_at ON public.url_scan_cache(expires_at);

ALTER TABLE public.url_scan_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read url scan cache"
  ON public.url_scan_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role manages url scan cache"
  ON public.url_scan_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage url scan cache"
  ON public.url_scan_cache FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User reports of suspicious URLs
CREATE TABLE public.url_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  url TEXT NOT NULL,
  host TEXT,
  reason TEXT,
  message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_url_reports_host ON public.url_reports(host);
CREATE INDEX idx_url_reports_created_at ON public.url_reports(created_at DESC);

ALTER TABLE public.url_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create url reports"
  ON public.url_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins view all url reports"
  ON public.url_reports FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reporters view their own reports"
  ON public.url_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Allowlisted hosts
CREATE TABLE public.url_allowlist (
  host TEXT PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.url_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read url allowlist"
  ON public.url_allowlist FOR SELECT
  USING (true);

CREATE POLICY "Admins manage url allowlist"
  ON public.url_allowlist FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.url_allowlist (host, note) VALUES
  ('rentli.ro', 'Official platform domain'),
  ('www.rentli.ro', 'Official platform domain'),
  ('rentli.com', 'Official platform domain'),
  ('www.rentli.com', 'Official platform domain'),
  ('the-rent-exchange.lovable.app', 'Lovable preview domain');
