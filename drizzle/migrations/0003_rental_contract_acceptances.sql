CREATE TABLE public.rental_contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','renter')),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  UNIQUE (rental_id, role)
);
GRANT SELECT ON public.rental_contract_acceptances TO authenticated;
GRANT ALL ON public.rental_contract_acceptances TO service_role;
ALTER TABLE public.rental_contract_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view contract acceptances" ON public.rental_contract_acceptances
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
      SELECT 1 FROM public.rentals r WHERE r.id = rental_id
        AND (r.owner_id = auth.uid() OR r.renter_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.accept_rental_contract(p_rental_id uuid, p_user_agent text DEFAULT NULL)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _role text; _ts timestamptz;
BEGIN
  SELECT * INTO r FROM rentals WHERE id = p_rental_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Închirierea nu există'; END IF;
  IF auth.uid() = r.owner_id THEN _role := 'owner';
  ELSIF auth.uid() = r.renter_id THEN _role := 'renter';
  ELSE RAISE EXCEPTION 'Nu ești parte în această închiriere'; END IF;
  IF r.payment_status NOT IN ('paid','captured','authorized') AND r.paid_at IS NULL THEN
    RAISE EXCEPTION 'Contractul poate fi acceptat doar după plată';
  END IF;
  INSERT INTO rental_contract_acceptances (rental_id, user_id, role, user_agent)
  VALUES (p_rental_id, auth.uid(), _role, left(p_user_agent, 300))
  ON CONFLICT (rental_id, role) DO NOTHING;
  SELECT accepted_at INTO _ts FROM rental_contract_acceptances WHERE rental_id = p_rental_id AND role = _role;
  RETURN _ts;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_rental_contract(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_contract_before_handover_pv()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.phase = 'handover' AND (
       (NEW.owner_signed_at IS NOT NULL AND OLD.owner_signed_at IS NULL) OR
       (NEW.renter_signed_at IS NOT NULL AND OLD.renter_signed_at IS NULL)) THEN
    IF (SELECT count(*) FROM rental_contract_acceptances WHERE rental_id = NEW.rental_id) < 2 THEN
      RAISE EXCEPTION 'Semnați întâi contractul (ambele părți trebuie să-l accepte).';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_contract_before_handover_pv BEFORE UPDATE ON public.rental_pv_documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contract_before_handover_pv();
ALTER TABLE public.rental_contract_acceptances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_contract_acceptances;