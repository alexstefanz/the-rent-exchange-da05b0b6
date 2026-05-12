REVOKE EXECUTE ON FUNCTION public.get_rental_pv_signed_url(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_pv_signed_url(uuid, text) TO authenticated;