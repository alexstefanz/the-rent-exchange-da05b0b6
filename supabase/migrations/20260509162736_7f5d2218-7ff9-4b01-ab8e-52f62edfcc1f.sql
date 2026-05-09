
-- Generic timestamp trigger function in public schema
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. SUPPORT MACROS
-- ============================================================================
CREATE TABLE public.support_macros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  category_group text,
  created_by uuid,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage macros"
ON public.support_macros FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_support_macros_usage ON public.support_macros(usage_count DESC);
CREATE INDEX idx_support_macros_category ON public.support_macros(category_group);

CREATE TRIGGER trg_support_macros_updated_at
BEFORE UPDATE ON public.support_macros
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.increment_macro_usage(p_macro_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.support_macros SET usage_count = usage_count + 1 WHERE id = p_macro_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.increment_macro_usage(uuid) TO authenticated;

-- ============================================================================
-- 2. CSAT
-- ============================================================================
CREATE TABLE public.support_csat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_csat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own csat for resolved tickets"
ON public.support_csat FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.ops_tickets t
    WHERE t.id = ticket_id
      AND t.requester_user_id = auth.uid()
      AND t.status IN ('RESOLVED', 'CLOSED')
  )
);

CREATE POLICY "Users view own csat"
ON public.support_csat FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_support_csat_ticket ON public.support_csat(ticket_id);
CREATE INDEX idx_support_csat_rating ON public.support_csat(rating);

CREATE OR REPLACE FUNCTION public.notify_admins_low_csat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_public_id text;
BEGIN
  IF NEW.rating <= 2 THEN
    SELECT public_id INTO v_public_id FROM public.ops_tickets WHERE id = NEW.ticket_id;
    INSERT INTO public.admin_notifications (type, title_ro, title_en, description_ro, description_en, priority, entity_type, entity_id, link)
    VALUES (
      'csat_low',
      'CSAT scăzut: ' || COALESCE(v_public_id, 'ticket'),
      'Low CSAT: ' || COALESCE(v_public_id, 'ticket'),
      'Utilizator a evaluat ticketul cu ' || NEW.rating || ' stele. ' || COALESCE('Comentariu: ' || NEW.comment, ''),
      'User rated this ticket ' || NEW.rating || ' stars. ' || COALESCE('Comment: ' || NEW.comment, ''),
      'high', 'ticket', NEW.ticket_id,
      '/admin/tickets?id=' || NEW.ticket_id::text
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_admins_low_csat
AFTER INSERT ON public.support_csat
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_low_csat();

-- ============================================================================
-- 3. KNOWLEDGE BASE
-- ============================================================================
CREATE TABLE public.kb_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title_ro text NOT NULL,
  title_en text,
  content_ro text NOT NULL,
  content_en text,
  excerpt_ro text,
  excerpt_en text,
  category_group text,
  tags text[] NOT NULL DEFAULT '{}',
  view_count integer NOT NULL DEFAULT 0,
  helpful_count integer NOT NULL DEFAULT 0,
  not_helpful_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view published articles"
ON public.kb_articles FOR SELECT TO public
USING (is_published = true);

CREATE POLICY "Admins manage articles"
ON public.kb_articles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_kb_articles_slug ON public.kb_articles(slug);
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_group);
CREATE INDEX idx_kb_articles_published ON public.kb_articles(is_published, sort_order);
CREATE INDEX idx_kb_articles_title_trgm ON public.kb_articles USING gin (title_ro gin_trgm_ops);

CREATE TRIGGER trg_kb_articles_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TABLE public.kb_article_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone log views"
ON public.kb_article_views FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Admins read views"
ON public.kb_article_views FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_kb_article_views_article ON public.kb_article_views(article_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.kb_record_view(p_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_article_id uuid;
BEGIN
  SELECT id INTO v_article_id FROM public.kb_articles WHERE slug = p_slug AND is_published = true;
  IF v_article_id IS NULL THEN RETURN; END IF;
  UPDATE public.kb_articles SET view_count = view_count + 1 WHERE id = v_article_id;
  INSERT INTO public.kb_article_views (article_id, user_id) VALUES (v_article_id, auth.uid());
END; $$;

GRANT EXECUTE ON FUNCTION public.kb_record_view(text) TO public;

CREATE OR REPLACE FUNCTION public.kb_vote(p_article_id uuid, p_helpful boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_helpful THEN
    UPDATE public.kb_articles SET helpful_count = helpful_count + 1 WHERE id = p_article_id AND is_published = true;
  ELSE
    UPDATE public.kb_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = p_article_id AND is_published = true;
  END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.kb_vote(uuid, boolean) TO public;

CREATE OR REPLACE FUNCTION public.kb_search(p_query text, p_limit integer DEFAULT 3)
RETURNS TABLE (id uuid, slug text, title_ro text, title_en text, excerpt_ro text, excerpt_en text, category_group text, similarity real)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.slug, a.title_ro, a.title_en, a.excerpt_ro, a.excerpt_en, a.category_group,
    GREATEST(
      similarity(a.title_ro, p_query),
      similarity(COALESCE(a.title_en, ''), p_query),
      similarity(COALESCE(a.excerpt_ro, ''), p_query) * 0.5
    )::real AS sim
  FROM public.kb_articles a
  WHERE a.is_published = true
    AND (
      a.title_ro ILIKE '%' || p_query || '%'
      OR COALESCE(a.title_en,'') ILIKE '%' || p_query || '%'
      OR similarity(a.title_ro, p_query) > 0.15
    )
  ORDER BY sim DESC
  LIMIT p_limit;
END; $$;

GRANT EXECUTE ON FUNCTION public.kb_search(text, integer) TO public;

-- ============================================================================
-- 4. CUSTOMER HEALTH SCORE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_health_score(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_open_tickets int; v_recent_tickets int; v_avg_csat numeric;
  v_low_csat_count int; v_high_csat_count int; v_sla_breaches int;
  v_lifetime_rentals int; v_score int; v_tier text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT COUNT(*) INTO v_open_tickets FROM public.ops_tickets
  WHERE requester_user_id = p_user_id
    AND status IN ('NEW','IN_PROGRESS','WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL');

  SELECT COUNT(*) INTO v_recent_tickets FROM public.ops_tickets
  WHERE requester_user_id = p_user_id AND created_at > now() - interval '30 days';

  SELECT AVG(c.rating), COUNT(*) FILTER (WHERE c.rating <= 2), COUNT(*) FILTER (WHERE c.rating >= 4)
  INTO v_avg_csat, v_low_csat_count, v_high_csat_count
  FROM public.support_csat c
  JOIN public.ops_tickets t ON t.id = c.ticket_id
  WHERE t.requester_user_id = p_user_id;

  SELECT COUNT(*) INTO v_sla_breaches FROM public.ops_tickets t
  LEFT JOIN LATERAL (
    SELECT MIN(created_at) AS first_admin_at
    FROM public.ops_ticket_messages
    WHERE ticket_id = t.id AND author_type <> 'CUSTOMER' AND is_internal = false
  ) m ON true
  WHERE t.requester_user_id = p_user_id
    AND (
      (t.priority = 'CRITICAL' AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '1 hour')
      OR (t.priority = 'HIGH'  AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '8 hours')
    );

  SELECT COUNT(*) INTO v_lifetime_rentals FROM public.rentals
  WHERE renter_id = p_user_id AND status IN ('completed','active');

  v_score := 100
    - LEAST(v_open_tickets * 5, 25)
    - LEAST(v_recent_tickets * 3, 15)
    - LEAST(v_low_csat_count * 15, 30)
    - LEAST(v_sla_breaches * 10, 20)
    + LEAST(v_lifetime_rentals * 1, 20)
    + LEAST(v_high_csat_count * 5, 15);

  v_score := GREATEST(0, LEAST(100, v_score));

  v_tier := CASE
    WHEN v_score >= 80 THEN 'EXCELLENT'
    WHEN v_score >= 60 THEN 'GOOD'
    WHEN v_score >= 40 THEN 'AT_RISK'
    ELSE 'CRITICAL'
  END;

  RETURN jsonb_build_object(
    'score', v_score, 'tier', v_tier,
    'signals', jsonb_build_object(
      'open_tickets', v_open_tickets,
      'recent_tickets_30d', v_recent_tickets,
      'avg_csat', v_avg_csat,
      'low_csat_count', v_low_csat_count,
      'high_csat_count', v_high_csat_count,
      'sla_breaches', v_sla_breaches,
      'lifetime_rentals', v_lifetime_rentals
    )
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.get_user_health_score(uuid) TO authenticated;

-- ============================================================================
-- 5. EXTEND get_support_analytics WITH CSAT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_support_analytics(
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to   timestamptz DEFAULT now()
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;

  WITH base AS (SELECT * FROM public.ops_tickets WHERE created_at >= p_from AND created_at < p_to),
  totals AS (
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'NEW')::int AS new_count,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress_count,
      COUNT(*) FILTER (WHERE status IN ('WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL'))::int AS waiting_count,
      COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_count,
      COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed_count,
      COUNT(*) FILTER (WHERE assigned_to IS NULL)::int AS unassigned_count
    FROM base
  ),
  by_priority AS (
    SELECT jsonb_object_agg(priority, c) AS data FROM (SELECT priority, COUNT(*)::int AS c FROM base GROUP BY priority) x
  ),
  by_category AS (
    SELECT jsonb_object_agg(COALESCE(category_group,'unknown'), c) AS data FROM (SELECT category_group, COUNT(*)::int AS c FROM base GROUP BY category_group) x
  ),
  first_response AS (
    SELECT AVG(EXTRACT(EPOCH FROM (m.first_admin_at - t.created_at))/60.0) AS avg_minutes
    FROM base t
    JOIN LATERAL (SELECT MIN(created_at) AS first_admin_at FROM public.ops_ticket_messages WHERE ticket_id = t.id AND author_type <> 'CUSTOMER' AND is_internal = false) m ON true
    WHERE m.first_admin_at IS NOT NULL
  ),
  resolution AS (
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600.0) AS avg_hours FROM base WHERE closed_at IS NOT NULL
  ),
  sla AS (
    SELECT COUNT(*)::int AS breach_count FROM base t
    LEFT JOIN LATERAL (SELECT MIN(created_at) AS first_admin_at FROM public.ops_ticket_messages WHERE ticket_id = t.id AND author_type <> 'CUSTOMER' AND is_internal = false) m ON true
    WHERE
      (t.priority = 'CRITICAL' AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '1 hour')
      OR (t.priority = 'HIGH'  AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '8 hours')
      OR (t.priority = 'MEDIUM'AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '24 hours')
      OR (t.priority = 'LOW'   AND COALESCE(m.first_admin_at, now()) - t.created_at > interval '72 hours')
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('day', day, 'created', created_count, 'resolved', resolved_count) ORDER BY day) AS data
    FROM (
      SELECT d::date AS day,
        COUNT(*) FILTER (WHERE created_at::date = d::date)::int AS created_count,
        COUNT(*) FILTER (WHERE closed_at::date = d::date)::int AS resolved_count
      FROM generate_series(p_from::date, (p_to - interval '1 day')::date, interval '1 day') d
      LEFT JOIN base ON created_at::date = d::date OR closed_at::date = d::date
      GROUP BY d
    ) x
  ),
  by_admin AS (
    SELECT jsonb_agg(jsonb_build_object('admin_id', assigned_to, 'name', COALESCE(p.full_name, p.email, 'N/A'), 'open', open_count, 'resolved', resolved_count, 'total', total_count)) AS data
    FROM (
      SELECT assigned_to,
        COUNT(*) FILTER (WHERE status IN ('NEW','IN_PROGRESS','WAITING_CUSTOMER','WAITING_OWNER','WAITING_INTERNAL'))::int AS open_count,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED','CLOSED'))::int AS resolved_count,
        COUNT(*)::int AS total_count
      FROM base WHERE assigned_to IS NOT NULL GROUP BY assigned_to
    ) a
    LEFT JOIN public.profiles p ON p.id = a.assigned_to
  ),
  csat AS (
    SELECT AVG(c.rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS count_total,
      jsonb_object_agg(c.rating, c.cnt) AS distribution
    FROM (
      SELECT c.rating, COUNT(*)::int AS cnt
      FROM public.support_csat c JOIN base t ON t.id = c.ticket_id
      GROUP BY c.rating
    ) c
  )
  SELECT jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    'totals', (SELECT row_to_json(totals) FROM totals),
    'by_priority', COALESCE((SELECT data FROM by_priority), '{}'::jsonb),
    'by_category', COALESCE((SELECT data FROM by_category), '{}'::jsonb),
    'avg_first_response_minutes', (SELECT avg_minutes FROM first_response),
    'avg_resolution_hours', (SELECT avg_hours FROM resolution),
    'sla_breach_count', (SELECT breach_count FROM sla),
    'daily', COALESCE((SELECT data FROM daily), '[]'::jsonb),
    'by_admin', COALESCE((SELECT data FROM by_admin), '[]'::jsonb),
    'csat', jsonb_build_object(
      'avg', COALESCE((SELECT avg_rating FROM csat), 0),
      'count', COALESCE((SELECT count_total FROM csat), 0),
      'distribution', COALESCE((SELECT distribution FROM csat), '{}'::jsonb)
    )
  ) INTO v_result;
  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_support_analytics(timestamptz, timestamptz) TO authenticated;

-- ============================================================================
-- SEED: Macros
-- ============================================================================
INSERT INTO public.support_macros (title, body, category_group) VALUES
  ('Salut & confirmare primire', E'Salut {user_name},\n\nMulțumim că ne-ai contactat. Am primit solicitarea ta legată de {ticket_id} și o investigăm. Revin cu un update în maxim 2 ore lucrătoare.\n\nO zi bună,\nEchipa Rentli', NULL),
  ('Cer dovadă plată', E'Salut {user_name},\n\nPentru a putea verifica situația, te rugăm să ne trimiți o captură cu confirmarea plății (extras bancar sau email Stripe).\n\nMulțumim,\nEchipa Rentli', 'FINANCIAL'),
  ('Cer poză daună', E'Salut {user_name},\n\nPentru a documenta corect situația, te rugăm să ne trimiți 2-3 poze clare cu produsul {product_title} și zona afectată.\n\nMulțumim,\nEchipa Rentli', 'PRODUCT'),
  ('Confirmare refund inițiat', E'Salut {user_name},\n\nAm inițiat refundul pentru rezervarea {rental_id}. Banii vor reveni în contul tău în 3-7 zile lucrătoare.\n\nO zi bună,\nEchipa Rentli', 'FINANCIAL'),
  ('Escalare la tehnic', E'Salut {user_name},\n\nAm transmis cazul tău către echipa tehnică. Te vom contacta în maxim 24 de ore cu o soluție.\n\nMulțumim pentru răbdare,\nEchipa Rentli', NULL),
  ('Așteptăm răspuns proprietar', E'Salut {user_name},\n\nAm contactat proprietarul produsului {product_title} și așteptăm răspunsul lui. Te ținem la curent imediat ce primim feedback.\n\nMulțumim,\nEchipa Rentli', 'RESERVATION'),
  ('KYC suplimentar necesar', E'Salut {user_name},\n\nPentru a continua procesul, te rugăm să accesezi secțiunea Verificare Identitate din profilul tău și să încarci documentele solicitate.\n\nMulțumim,\nEchipa Rentli', 'USER'),
  ('Închidere - rezolvat', E'Salut {user_name},\n\nNe bucurăm că am putut rezolva situația. Marchez ticketul {ticket_id} ca rezolvat. Dacă mai ai întrebări, deschide un ticket nou.\n\nO zi bună,\nEchipa Rentli', NULL),
  ('Solicit detalii suplimentare', E'Salut {user_name},\n\nPentru a putea avansa, am nevoie de mai multe detalii: ce s-a întâmplat exact, când și ce ai încercat până acum?\n\nMulțumim,\nEchipa Rentli', NULL),
  ('Refund parțial aprobat', E'Salut {user_name},\n\nÎn urma analizei, aprobăm un refund parțial pentru rezervarea {rental_id}. Suma va fi creditată în 3-7 zile lucrătoare.\n\nO zi bună,\nEchipa Rentli', 'DISPUTE');

-- ============================================================================
-- SEED: KB articles
-- ============================================================================
INSERT INTO public.kb_articles (slug, title_ro, title_en, excerpt_ro, excerpt_en, content_ro, content_en, category_group, tags, is_published, sort_order) VALUES
  ('cum-anulez-rezervare', 'Cum anulez o rezervare', 'How to cancel a reservation',
    'Pașii pentru anularea unei rezervări și politica de refund.', 'Steps to cancel a reservation and refund policy.',
    E'## Cum anulez o rezervare\n\n1. Mergi la **Profil → Rezervările mele**\n2. Selectează rezervarea\n3. Apasă **Anulează**\n4. Confirmă\n\n## Politica de refund\n\n- Peste 48h înainte: refund 100%\n- 24-48h înainte: refund 50%\n- Sub 24h: fără refund',
    E'## How to cancel\n\n1. Profile → My reservations\n2. Select reservation\n3. Click Cancel\n4. Confirm\n\n## Refund policy\n\n- 48h+: 100%\n- 24-48h: 50%\n- <24h: no refund',
    'RESERVATION', ARRAY['anulare','refund','rezervare'], true, 1),
  ('cum-platesc-pe-rentli', 'Cum plătesc pe Rentli', 'How to pay on Rentli',
    'Metode de plată acceptate și cum funcționează escrow-ul.', 'Accepted payment methods and how escrow works.',
    E'## Metode de plată\n\nAcceptăm Visa și Mastercard prin Stripe.\n\n## Escrow\n\n1. Cardul e autorizat la rezervare\n2. Banii reținuți în escrow\n3. Capturați la preluare\n4. Eliberați proprietarului la final',
    E'## Payment methods\n\nVisa & Mastercard via Stripe.\n\n## Escrow\n\n1. Card authorized at booking\n2. Funds held\n3. Captured on pickup\n4. Released at end',
    'FINANCIAL', ARRAY['plata','stripe','escrow'], true, 2),
  ('produs-defect-la-livrare', 'Produsul e defect la preluare. Ce fac?', 'Product is defective on pickup',
    'Pașii imediați dacă produsul nu funcționează.', 'Immediate steps if product is broken.',
    E'## Ce fac\n\n1. NU pleca cu produsul\n2. Fă 3-5 poze clare\n3. Discută cu proprietarul\n4. Deschide ticket cu poze atașate\n5. Răspundem în 2 ore',
    E'## What to do\n\n1. DO NOT take the product\n2. Take 3-5 clear photos\n3. Talk to the owner\n4. Open ticket with photos\n5. We respond in 2h',
    'PRODUCT', ARRAY['defect','dauna','refund'], true, 3),
  ('verificare-identitate-kyc', 'Verificarea identității (KYC)', 'Identity verification (KYC)',
    'De ce e necesară verificarea KYC și cum o completezi.', 'Why KYC is needed and how to complete it.',
    E'## De ce KYC\n\nObligatoriu pentru rezervări peste 500 RON, listare produse, verificare cont bancar.\n\n## Cum completez\n\n1. Profil → Verificare identitate\n2. Încarcă CI/Pașaport\n3. Selfie cu actul\n4. Aprobăm în 24h',
    E'## Why KYC\n\nRequired for rentals 500+ RON, listing products, bank verification.\n\n## How\n\n1. Profile → Identity verification\n2. Upload ID\n3. Selfie with ID\n4. Approved in 24h',
    'USER', ARRAY['kyc','verificare'], true, 4),
  ('cum-listez-produs', 'Cum listez un produs spre închiriere', 'How to list a product for rent',
    'Ghid pas cu pas pentru listarea unui produs.', 'Step by step guide.',
    E'## Cum listez\n\n1. + Adaugă produs din header\n2. Completează cei 6 pași\n3. Min 5 poze de calitate\n4. Setează preț (5% comision Rentli)\n5. Trimite spre aprobare\n6. Aprobăm în 24h',
    E'## How to list\n\n1. + Add product\n2. 6 steps\n3. Min 5 quality photos\n4. Set price (5% fee)\n5. Submit\n6. Approved in 24h',
    'PRODUCT', ARRAY['listare','produs'], true, 5),
  ('cum-primesc-banii-castig', 'Cum primesc banii câștigați', 'How to receive earnings',
    'Calendarul de plăți și cum retragi banii.', 'Payment schedule and withdrawal.',
    E'## Calendar plăți\n\nBanii eliberați în ziua finalizării. Apar imediat în Soldul tău.\n\n## Cum retrag\n\n1. Profil → Soldul meu → Solicită retragere\n2. Adaugă IBAN\n3. Procesăm în 1-3 zile\n\n## Comision\n\n5% per închiriere (gratis primele 3).',
    E'## Schedule\n\nReleased on completion. Immediately in your balance.\n\n## Withdraw\n\n1. Profile → Balance → Request\n2. Add IBAN\n3. Processed in 1-3 days\n\n## Fee\n\n5% per rental (first 3 free).',
    'FINANCIAL', ARRAY['plati','retragere','iban'], true, 6);
