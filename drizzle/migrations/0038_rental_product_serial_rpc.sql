CREATE OR REPLACE FUNCTION public.get_rental_product_serial(_rental_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.serial_number
  FROM public.rentals r
  JOIN public.products p ON p.id = r.product_id
  WHERE r.id = _rental_id
    AND (
      auth.uid() = r.owner_id
      OR (auth.uid() = r.renter_id AND r.status <> 'pending')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'insurer')
    )
$$;
REVOKE ALL ON FUNCTION public.get_rental_product_serial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_product_serial(uuid) TO authenticated, service_role;