ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS admin_handover_unlocked_at timestamptz, ADD COLUMN IF NOT EXISTS admin_handover_unlocked_by uuid;

CREATE OR REPLACE FUNCTION public.admin_unlock_rental_handover(_rental_id uuid, _unlock boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE public.rentals
     SET admin_handover_unlocked_at = CASE WHEN _unlock THEN now() ELSE NULL END,
         admin_handover_unlocked_by = CASE WHEN _unlock THEN auth.uid() ELSE NULL END
   WHERE id = _rental_id;
  INSERT INTO public.rental_status_history(rental_id, from_status, to_status, actor_id, actor_role, reason)
  SELECT id, status, status, auth.uid(), 'admin', CASE WHEN _unlock THEN 'admin_unlock_handover' ELSE 'admin_relock_handover' END
    FROM public.rentals WHERE id = _rental_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_unlock_rental_handover(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_unlock_rental_handover(uuid, boolean) TO authenticated;