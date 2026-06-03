-- 1) Table
CREATE TABLE public.payout_ibans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  iban text NOT NULL,
  account_holder_name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, iban)
);

CREATE INDEX idx_payout_ibans_user ON public.payout_ibans(user_id);

-- 2) Grants (auth-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_ibans TO authenticated;
GRANT ALL ON public.payout_ibans TO service_role;

-- 3) RLS
ALTER TABLE public.payout_ibans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payout ibans"
ON public.payout_ibans FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own payout ibans"
ON public.payout_ibans FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own payout ibans"
ON public.payout_ibans FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own payout ibans"
ON public.payout_ibans FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage payout ibans"
ON public.payout_ibans FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) BEFORE INSERT/UPDATE trigger: enforce max 3, normalize iban, force holder = profile full_name
CREATE OR REPLACE FUNCTION public.enforce_payout_iban_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_full_name text;
BEGIN
  -- Normalize IBAN (uppercase, no spaces)
  NEW.iban := upper(regexp_replace(NEW.iban, '\s+', '', 'g'));

  -- Format check (RO + 22 alphanumerics; 24 total)
  IF NEW.iban !~ '^RO[0-9]{2}[A-Z0-9]{20}$' THEN
    RAISE EXCEPTION 'IBAN invalid' USING ERRCODE = '22023';
  END IF;

  -- Lookup full name from profile and force account_holder_name to match
  SELECT trim(coalesce(full_name, '')) INTO v_full_name
  FROM public.profiles WHERE id = NEW.user_id;

  IF v_full_name IS NULL OR v_full_name = '' THEN
    RAISE EXCEPTION 'Completează numele complet în profil înainte de a adăuga un IBAN' USING ERRCODE = '22023';
  END IF;

  NEW.account_holder_name := v_full_name;

  -- Max 3 per user (only on INSERT)
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO v_count FROM public.payout_ibans WHERE user_id = NEW.user_id;
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Poți avea maxim 3 IBAN-uri salvate' USING ERRCODE = '22023';
    END IF;
    -- Auto-default first row
    IF v_count = 0 THEN
      NEW.is_default := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_payout_iban_rules
BEFORE INSERT OR UPDATE ON public.payout_ibans
FOR EACH ROW EXECUTE FUNCTION public.enforce_payout_iban_rules();

-- 5) AFTER INSERT/UPDATE trigger: ensure single default, sync profiles.iban
CREATE OR REPLACE FUNCTION public.sync_default_payout_iban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_iban text;
  v_default_holder text;
BEGIN
  -- Enforce single default
  IF NEW.is_default THEN
    UPDATE public.payout_ibans
    SET is_default = false
    WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default = true;
  END IF;

  -- Ensure at least one default exists
  IF NOT EXISTS (SELECT 1 FROM public.payout_ibans WHERE user_id = NEW.user_id AND is_default = true) THEN
    UPDATE public.payout_ibans
    SET is_default = true
    WHERE id = (
      SELECT id FROM public.payout_ibans
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC LIMIT 1
    );
  END IF;

  -- Sync profile with current default
  SELECT iban, account_holder_name INTO v_default_iban, v_default_holder
  FROM public.payout_ibans
  WHERE user_id = NEW.user_id AND is_default = true
  LIMIT 1;

  UPDATE public.profiles
  SET iban = v_default_iban,
      account_holder_name = v_default_holder
  WHERE id = NEW.user_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_default_payout_iban
AFTER INSERT OR UPDATE OF is_default ON public.payout_ibans
FOR EACH ROW EXECUTE FUNCTION public.sync_default_payout_iban();

-- 6) AFTER DELETE trigger: promote new default, sync profile
CREATE OR REPLACE FUNCTION public.sync_after_payout_iban_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_iban text;
  v_default_holder text;
BEGIN
  IF OLD.is_default THEN
    UPDATE public.payout_ibans
    SET is_default = true
    WHERE id = (
      SELECT id FROM public.payout_ibans
      WHERE user_id = OLD.user_id
      ORDER BY created_at ASC LIMIT 1
    );
  END IF;

  SELECT iban, account_holder_name INTO v_default_iban, v_default_holder
  FROM public.payout_ibans
  WHERE user_id = OLD.user_id AND is_default = true
  LIMIT 1;

  UPDATE public.profiles
  SET iban = v_default_iban,
      account_holder_name = v_default_holder
  WHERE id = OLD.user_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_after_payout_iban_delete
AFTER DELETE ON public.payout_ibans
FOR EACH ROW EXECUTE FUNCTION public.sync_after_payout_iban_delete();

-- 7) Backfill from profiles.iban
INSERT INTO public.payout_ibans (user_id, iban, account_holder_name, is_default)
SELECT
  p.id,
  upper(regexp_replace(p.iban, '\s+', '', 'g')),
  trim(coalesce(p.account_holder_name, p.full_name, '')),
  true
FROM public.profiles p
WHERE p.iban IS NOT NULL
  AND p.iban ~ '^[A-Za-z0-9\s]+$'
  AND length(regexp_replace(p.iban, '\s+', '', 'g')) = 24
  AND upper(regexp_replace(p.iban, '\s+', '', 'g')) ~ '^RO[0-9]{2}[A-Z0-9]{20}$'
  AND trim(coalesce(p.account_holder_name, p.full_name, '')) <> ''
ON CONFLICT (user_id, iban) DO NOTHING;

-- 8) RPC: secure delete with pending-withdrawal check
CREATE OR REPLACE FUNCTION public.delete_payout_iban(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_iban text;
  v_pending integer;
BEGIN
  SELECT user_id, iban INTO v_user_id, v_iban
  FROM public.payout_ibans WHERE id = p_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'IBAN inexistent' USING ERRCODE = '22023';
  END IF;

  IF v_user_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acces interzis' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_pending
  FROM public.withdrawal_requests
  WHERE user_id = v_user_id AND iban = v_iban AND status = 'pending';

  IF v_pending > 0 THEN
    RAISE EXCEPTION 'Există o cerere de retragere în așteptare pentru acest IBAN. Așteaptă procesarea ei.' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.payout_ibans WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_payout_iban(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_payout_iban(uuid) FROM anon, public;
