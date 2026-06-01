CREATE OR REPLACE FUNCTION public.auto_confirm_overdue_handovers()
RETURNS TABLE(rental_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass renter-lock trigger for this controlled batch update.
  PERFORM set_config('app.bypass_renter_lock', 'on', true);

  RETURN QUERY
  WITH eligible AS (
    SELECT r.id
    FROM public.rentals r
    JOIN public.rental_pv_documents pv
      ON pv.rental_id = r.id AND pv.phase = 'handover'
    WHERE r.handover_confirmed_at IS NULL
      AND r.status IN ('confirmed','active')
      AND pv.owner_signed_at  IS NOT NULL
      AND pv.renter_signed_at IS NOT NULL
      AND GREATEST(pv.owner_signed_at, pv.renter_signed_at) < (now() - interval '24 hours')
  ),
  updated AS (
    UPDATE public.rentals r
       SET handover_confirmed_at = now(),
           status = 'active'
     WHERE r.id IN (SELECT id FROM eligible)
    RETURNING r.id
  )
  SELECT id FROM updated;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_confirm_overdue_handovers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_confirm_overdue_handovers() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_overdue_handovers() TO service_role;