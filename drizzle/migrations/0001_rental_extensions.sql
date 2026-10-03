CREATE TABLE public.rental_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  requested_days integer NOT NULL CHECK (requested_days BETWEEN 1 AND 60),
  original_end_date date NOT NULL,
  requested_end_date date NOT NULL,
  approved_days integer,
  approved_end_date date,
  daily_price numeric NOT NULL,
  subtotal_amount numeric,
  platform_fee numeric,
  total_amount numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  note text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  paid_at timestamptz
);
CREATE INDEX idx_rental_extensions_rental ON public.rental_extensions(rental_id);
GRANT SELECT ON public.rental_extensions TO authenticated;
GRANT ALL ON public.rental_extensions TO service_role;
ALTER TABLE public.rental_extensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read extensions" ON public.rental_extensions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.rentals r WHERE r.id = rental_id AND (r.owner_id = auth.uid() OR r.renter_id = auth.uid())) OR public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_extensions;

CREATE OR REPLACE FUNCTION public.request_rental_extension(_rental_id uuid, _days integer, _note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rentals; new_id uuid; new_end date;
BEGIN
  SELECT * INTO r FROM public.rentals WHERE id = _rental_id;
  IF r.id IS NULL OR r.renter_id <> auth.uid() THEN RAISE EXCEPTION 'Doar chiriașul poate cere prelungirea.'; END IF;
  IF r.handover_confirmed_at IS NULL OR r.return_confirmed_at IS NOT NULL OR r.status IN ('cancelled','rejected','completed') THEN
    RAISE EXCEPTION 'Prelungirea se poate cere doar în timpul închirierii active.'; END IF;
  IF _days < 1 OR _days > 60 THEN RAISE EXCEPTION 'Număr de zile invalid.'; END IF;
  IF EXISTS (SELECT 1 FROM public.rental_extensions WHERE rental_id = _rental_id AND (status = 'pending' OR (status='approved' AND payment_status='pending'))) THEN
    RAISE EXCEPTION 'Există deja o cerere de prelungire în curs.'; END IF;
  new_end := r.end_date + _days;
  IF EXISTS (SELECT 1 FROM public.rentals o WHERE o.product_id = r.product_id AND o.id <> r.id
     AND o.status NOT IN ('cancelled','rejected','completed','pending')
     AND o.start_date <= new_end AND o.end_date > r.end_date) THEN
    RAISE EXCEPTION 'Produsul este deja rezervat în perioada cerută.'; END IF;
  INSERT INTO public.rental_extensions(rental_id, requested_by, requested_days, original_end_date, requested_end_date, daily_price, note)
  VALUES (_rental_id, auth.uid(), _days, r.end_date, new_end, r.daily_price, left(_note, 500)) RETURNING id INTO new_id;
  PERFORM public.create_user_notification(r.owner_id, 'extension_requested',
    'Cerere de prelungire (+' || _days || ' zile)', 'Extension request (+' || _days || ' days)',
    'Chiriașul cere prelungirea închirierii ' || r.public_id, 'The renter asked to extend rental ' || r.public_id,
    '/inchirieri/' || r.public_id);
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.decide_rental_extension(_extension_id uuid, _approved_days integer, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.rental_extensions; r public.rentals; sub numeric; fee numeric;
BEGIN
  SELECT * INTO e FROM public.rental_extensions WHERE id = _extension_id FOR UPDATE;
  SELECT * INTO r FROM public.rentals WHERE id = e.rental_id;
  IF r.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Doar proprietarul poate decide.'; END IF;
  IF e.status <> 'pending' THEN RAISE EXCEPTION 'Cererea a fost deja procesată.'; END IF;
  IF _approved_days IS NULL OR _approved_days <= 0 THEN
    UPDATE public.rental_extensions SET status='rejected', rejection_reason=left(_reason,500), decided_at=now() WHERE id=e.id;
    PERFORM public.create_user_notification(r.renter_id, 'extension_rejected', 'Prelungire refuzată', 'Extension declined',
      'Proprietarul a refuzat prelungirea pentru ' || r.public_id, 'The owner declined the extension for ' || r.public_id, '/inchirieri/' || r.public_id);
    RETURN;
  END IF;
  IF _approved_days > e.requested_days THEN RAISE EXCEPTION 'Nu poți aproba mai multe zile decât s-au cerut.'; END IF;
  sub := round(_approved_days * e.daily_price, 2);
  fee := CASE WHEN coalesce(r.platform_fee_percent,0) > 0 THEN greatest(1, round(sub * r.platform_fee_percent / 100, 2)) ELSE 0 END;
  UPDATE public.rental_extensions SET status='approved', approved_days=_approved_days,
    approved_end_date = e.original_end_date + _approved_days, subtotal_amount=sub, platform_fee=fee, total_amount=sub+fee, decided_at=now()
  WHERE id=e.id;
  PERFORM public.create_user_notification(r.renter_id, 'extension_approved', 'Prelungire aprobată (+' || _approved_days || ' zile)',
    'Extension approved (+' || _approved_days || ' days)', 'Achită diferența pentru a confirma prelungirea ' || r.public_id,
    'Pay the difference to confirm the extension of ' || r.public_id, '/inchirieri/' || r.public_id);
END $$;

CREATE OR REPLACE FUNCTION public.pay_rental_extension_with_wallet(_extension_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.rental_extensions; r public.rentals; bal numeric;
BEGIN
  SELECT * INTO e FROM public.rental_extensions WHERE id = _extension_id FOR UPDATE;
  SELECT * INTO r FROM public.rentals WHERE id = e.rental_id FOR UPDATE;
  IF r.renter_id <> auth.uid() THEN RAISE EXCEPTION 'Doar chiriașul poate plăti.'; END IF;
  IF e.status <> 'approved' OR e.payment_status <> 'pending' THEN RAISE EXCEPTION 'Prelungirea nu așteaptă plata.'; END IF;
  SELECT coalesce(sum(amount),0) INTO bal FROM public.wallet_ledger WHERE user_id = auth.uid();
  IF bal < e.total_amount THEN RAISE EXCEPTION 'Sold insuficient în portofel (% RON disponibili).', bal; END IF;
  INSERT INTO public.wallet_ledger(user_id, amount, kind, rental_id, metadata)
  VALUES (auth.uid(), -e.total_amount, 'rental_credit_capture', r.id, jsonb_build_object('extension_id', e.id, 'note', 'Plată prelungire'));
  PERFORM set_config('app.bypass_renter_lock','on', true);
  UPDATE public.rentals SET end_date = e.approved_end_date, rental_days = rental_days + e.approved_days,
    subtotal = subtotal + e.subtotal_amount, platform_fee = platform_fee + e.platform_fee,
    owner_payout = owner_payout + e.subtotal_amount, updated_at = now()
  WHERE id = r.id;
  PERFORM set_config('app.bypass_renter_lock','off', true);
  UPDATE public.rental_extensions SET payment_status='paid', paid_at=now() WHERE id=e.id;
  PERFORM public.create_user_notification(r.owner_id, 'extension_paid', 'Prelungire plătită', 'Extension paid',
    'Închirierea ' || r.public_id || ' a fost prelungită până la ' || to_char(e.approved_end_date,'DD.MM.YYYY'),
    'Rental ' || r.public_id || ' was extended until ' || to_char(e.approved_end_date,'DD.MM.YYYY'), '/inchirieri/' || r.public_id);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_rental_extension(_extension_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rental_extensions SET status='cancelled', decided_at=now()
  WHERE id=_extension_id AND requested_by = auth.uid() AND (status='pending' OR (status='approved' AND payment_status='pending'));
  IF NOT FOUND THEN RAISE EXCEPTION 'Cererea nu poate fi anulată.'; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.request_rental_extension(uuid,integer,text), public.decide_rental_extension(uuid,integer,text), public.pay_rental_extension_with_wallet(uuid), public.cancel_rental_extension(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_rental_extension(uuid,integer,text), public.decide_rental_extension(uuid,integer,text), public.pay_rental_extension_with_wallet(uuid), public.cancel_rental_extension(uuid) TO authenticated;