
CREATE OR REPLACE FUNCTION public.get_owner_listings_stats(p_owner uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM products WHERE owner_id = p_owner AND deleted_at IS NULL),
    'active', (SELECT count(*) FROM products WHERE owner_id = p_owner AND is_active = true AND approval_status = 'approved' AND deleted_at IS NULL),
    'pending', (SELECT count(*) FROM products WHERE owner_id = p_owner AND approval_status = 'pending' AND deleted_at IS NULL),
    'hidden', (SELECT count(*) FROM products WHERE owner_id = p_owner AND is_active = false AND approval_status = 'approved' AND deleted_at IS NULL),
    'rejected', (SELECT count(*) FROM products WHERE owner_id = p_owner AND approval_status = 'rejected' AND deleted_at IS NULL),
    'drafts', (SELECT count(*) FROM product_drafts WHERE owner_id = p_owner AND product_id IS NULL),
    'new_requests', (SELECT count(*) FROM rentals WHERE owner_id = p_owner AND status = 'pending'),
    'earnings_total', COALESCE((SELECT sum(owner_payout) FROM rentals WHERE owner_id = p_owner AND status = 'completed'), 0)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_owner_listings_stats(uuid) TO authenticated;
