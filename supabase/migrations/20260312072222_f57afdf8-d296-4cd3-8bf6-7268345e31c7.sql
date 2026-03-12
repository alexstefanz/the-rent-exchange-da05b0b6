
CREATE OR REPLACE FUNCTION public.get_booked_dates(p_product_id uuid)
RETURNS TABLE(start_date date, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT r.start_date, r.end_date
  FROM rentals r
  WHERE r.product_id = p_product_id
    AND r.status IN ('confirmed', 'active')
$$;
