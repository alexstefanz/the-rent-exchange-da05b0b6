ALTER TABLE public.rental_contract_acceptances ADD COLUMN IF NOT EXISTS signature_data text;
CREATE OR REPLACE FUNCTION public.accept_rental_contract_signed(p_rental_id uuid, p_signature text, p_user_agent text DEFAULT NULL)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _role text; _ts timestamptz;
BEGIN
  IF p_signature IS NULL OR length(p_signature) < 100 OR length(p_signature) > 500000 THEN
    RAISE EXCEPTION 'Semnătura lipsește sau este invalidă';
  END IF;
  SELECT * INTO r FROM rentals WHERE id = p_rental_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Închirierea nu există'; END IF;
  IF auth.uid() = r.owner_id THEN _role := 'owner';
  ELSIF auth.uid() = r.renter_id THEN _role := 'renter';
  ELSE RAISE EXCEPTION 'Nu ești parte în această închiriere'; END IF;
  IF r.payment_status NOT IN ('paid','captured','authorized') AND r.paid_at IS NULL THEN
    RAISE EXCEPTION 'Contractul poate fi semnat doar după plată';
  END IF;
  INSERT INTO rental_contract_acceptances (rental_id, user_id, role, user_agent, signature_data)
  VALUES (p_rental_id, auth.uid(), _role, left(p_user_agent, 300), p_signature)
  ON CONFLICT (rental_id, role) DO NOTHING;
  SELECT accepted_at INTO _ts FROM rental_contract_acceptances WHERE rental_id = p_rental_id AND role = _role;
  RETURN _ts;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_rental_contract_signed(uuid, text, text) TO authenticated;