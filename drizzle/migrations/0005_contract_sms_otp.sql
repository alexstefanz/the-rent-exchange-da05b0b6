CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.rental_contract_acceptances
  ADD COLUMN IF NOT EXISTS validation_channel text,
  ADD COLUMN IF NOT EXISTS validation_destination text,
  ADD COLUMN IF NOT EXISTS validation_ref text,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

CREATE TABLE public.rental_contract_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone_masked text NOT NULL,
  code_hash text NOT NULL,
  ref text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rental_contract_otps TO service_role;
ALTER TABLE public.rental_contract_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.rental_contract_otps (user_id, rental_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.verify_and_sign_rental_contract(p_rental_id uuid, p_code text, p_signature text, p_user_agent text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r record; o record; _role text; _ts timestamptz;
BEGIN
  IF p_signature IS NULL OR length(p_signature) < 100 OR length(p_signature) > 500000 THEN
    RAISE EXCEPTION 'Semnătura lipsește sau este invalidă'; END IF;
  IF p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'Codul SMS trebuie să aibă 6 cifre'; END IF;
  SELECT * INTO r FROM rentals WHERE id = p_rental_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Închirierea nu există'; END IF;
  IF auth.uid() = r.owner_id THEN _role := 'owner';
  ELSIF auth.uid() = r.renter_id THEN _role := 'renter';
  ELSE RAISE EXCEPTION 'Nu ești parte în această închiriere'; END IF;
  IF r.payment_status NOT IN ('paid','captured','authorized') AND r.paid_at IS NULL THEN
    RAISE EXCEPTION 'Contractul poate fi semnat doar după plată'; END IF;
  SELECT * INTO o FROM rental_contract_otps
   WHERE rental_id = p_rental_id AND user_id = auth.uid() AND consumed_at IS NULL
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND OR o.expires_at < now() THEN RAISE EXCEPTION 'Codul a expirat. Cere un cod nou.'; END IF;
  IF o.attempts >= 5 THEN RAISE EXCEPTION 'Prea multe încercări. Cere un cod nou.'; END IF;
  IF o.code_hash <> encode(digest(auth.uid()::text || ':' || p_rental_id::text || ':' || p_code, 'sha256'), 'hex') THEN
    UPDATE rental_contract_otps SET attempts = attempts + 1 WHERE id = o.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Cod incorect');
  END IF;
  UPDATE rental_contract_otps SET consumed_at = now() WHERE id = o.id;
  INSERT INTO rental_contract_acceptances (rental_id, user_id, role, user_agent, signature_data, validation_channel, validation_destination, validation_ref, validated_at)
  VALUES (p_rental_id, auth.uid(), _role, left(p_user_agent, 300), p_signature, 'sms', o.phone_masked, o.ref, now())
  ON CONFLICT (rental_id, role) DO NOTHING;
  SELECT accepted_at INTO _ts FROM rental_contract_acceptances WHERE rental_id = p_rental_id AND role = _role;
  RETURN jsonb_build_object('ok', true, 'accepted_at', _ts, 'ref', o.ref);
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_rental_contract_signed(uuid, text, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_rental_contract(uuid, text) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.verify_and_sign_rental_contract(uuid, text, text, text) TO authenticated;