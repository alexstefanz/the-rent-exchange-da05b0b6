CREATE OR REPLACE FUNCTION public.mark_renter_confirmation_seen(_rental_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rentals
  SET renter_seen_confirmation = true
  WHERE id = _rental_id
    AND renter_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_renter_confirmation_seen(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_renter_confirmation_seen(uuid) TO authenticated;