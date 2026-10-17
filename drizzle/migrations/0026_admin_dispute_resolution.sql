CREATE OR REPLACE FUNCTION public.admin_resolve_rental_dispute(_rental_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r public.rentals;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO r FROM public.rentals WHERE id = _rental_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.dispute_status <> 'open' THEN RAISE EXCEPTION 'Nu există o dispută deschisă.'; END IF;
  PERFORM set_config('app.bypass_renter_lock','on', true);
  UPDATE public.rentals SET dispute_status = 'resolved', updated_at = now() WHERE id = r.id;
  PERFORM set_config('app.bypass_renter_lock','off', true);
  INSERT INTO public.rental_status_history(rental_id, from_status, to_status, actor_id, actor_role, reason, metadata)
  VALUES (r.id, r.status, r.status, auth.uid(), 'admin', 'Dispută rezolvată de admin', jsonb_build_object('note', _note, 'dispute_reason', r.dispute_reason));
  PERFORM public.create_user_notification(uid, 'dispute_resolved', 'Disputa a fost rezolvată', 'Dispute resolved',
    'Echipa Rentli a analizat disputa pentru ' || r.public_id || ' și a reluat procesul.' || CASE WHEN coalesce(_note,'') <> '' THEN ' Notă: ' || _note ELSE '' END,
    'The Rentli team reviewed the dispute for ' || r.public_id || ' and resumed the process.', '/inchirieri/' || r.public_id)
  FROM unnest(ARRAY[r.owner_id, r.renter_id]) AS uid WHERE uid IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.admin_resolve_rental_dispute(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_rental_dispute(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_admin_dispute_opened()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.dispute_status = 'open' AND OLD.dispute_status IS DISTINCT FROM 'open' THEN
    INSERT INTO public.admin_notifications(type, title_ro, title_en, description_ro, link, entity_id, entity_type, priority)
    VALUES ('dispute_opened', 'Dispută deschisă: ' || NEW.public_id, 'Dispute opened: ' || NEW.public_id,
      left(coalesce(NEW.dispute_reason,''), 300), '/admin/reservations?dispute=' || NEW.public_id, NEW.id, 'rental', 'urgent');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_admin_dispute_opened ON public.rentals;
CREATE TRIGGER trg_notify_admin_dispute_opened AFTER UPDATE OF dispute_status ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_dispute_opened();