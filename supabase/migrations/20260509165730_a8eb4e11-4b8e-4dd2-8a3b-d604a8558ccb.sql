
-- RPC: get_product_extended_stats - aggregate stats for product detail page
CREATE OR REPLACE FUNCTION public.get_product_extended_stats(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_times_rented int;
  v_last_booking_at timestamptz;
  v_watchers_count int;
  v_owner_total_rentals int;
  v_owner_response_minutes numeric;
  v_owner_response_rate numeric;
  v_owner_member_since timestamptz;
  v_owner_avg_rating numeric;
  v_owner_review_count int;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.products WHERE id = p_product_id;
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'product_not_found');
  END IF;

  -- Times rented & last booking (this product)
  SELECT COUNT(*), MAX(confirmed_at)
    INTO v_times_rented, v_last_booking_at
  FROM public.rentals
  WHERE product_id = p_product_id
    AND status IN ('confirmed', 'active', 'completed');

  -- Watchers
  SELECT COUNT(*) INTO v_watchers_count
  FROM public.favorite_products
  WHERE product_id = p_product_id;

  -- Owner total completed rentals
  SELECT COUNT(*) INTO v_owner_total_rentals
  FROM public.rentals
  WHERE owner_id = v_owner_id AND status = 'completed';

  -- Owner response stats: avg first reply minutes & response rate
  WITH conv AS (
    SELECT c.id, c.created_at,
      (SELECT MIN(m.created_at) FROM public.messages m
        WHERE m.conversation_id = c.id AND m.sender_id = c.owner_id) AS first_reply_at,
      (SELECT MIN(m.created_at) FROM public.messages m
        WHERE m.conversation_id = c.id AND m.sender_id = c.buyer_id) AS first_buyer_at
    FROM public.conversations c
    WHERE c.owner_id = v_owner_id
    ORDER BY c.created_at DESC
    LIMIT 200
  )
  SELECT
    AVG(EXTRACT(EPOCH FROM (first_reply_at - first_buyer_at)) / 60.0)
      FILTER (WHERE first_reply_at IS NOT NULL AND first_buyer_at IS NOT NULL AND first_reply_at >= first_buyer_at),
    CASE WHEN COUNT(*) FILTER (WHERE first_buyer_at IS NOT NULL) > 0
         THEN COUNT(*) FILTER (WHERE first_reply_at IS NOT NULL AND first_buyer_at IS NOT NULL)::numeric * 100
              / COUNT(*) FILTER (WHERE first_buyer_at IS NOT NULL)
         ELSE NULL END
  INTO v_owner_response_minutes, v_owner_response_rate
  FROM conv;

  -- Owner member since
  SELECT created_at INTO v_owner_member_since FROM public.profiles WHERE id = v_owner_id;

  -- Owner avg rating across all their products
  SELECT AVG(pr.rating), COUNT(*)
    INTO v_owner_avg_rating, v_owner_review_count
  FROM public.product_reviews pr
  JOIN public.products p ON p.id = pr.product_id
  WHERE p.owner_id = v_owner_id;

  RETURN jsonb_build_object(
    'times_rented', COALESCE(v_times_rented, 0),
    'last_booking_at', v_last_booking_at,
    'watchers_count', COALESCE(v_watchers_count, 0),
    'owner_total_rentals', COALESCE(v_owner_total_rentals, 0),
    'owner_response_minutes', v_owner_response_minutes,
    'owner_response_rate', v_owner_response_rate,
    'owner_member_since', v_owner_member_since,
    'owner_avg_rating', v_owner_avg_rating,
    'owner_review_count', COALESCE(v_owner_review_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_extended_stats(uuid) TO anon, authenticated;

-- RPC: get_product_review_breakdown - sub-criteria breakdown
CREATE OR REPLACE FUNCTION public.get_product_review_breakdown(p_product_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'avg_rating', COALESCE(AVG(rating)::numeric(3,2), 0),
    'count', COUNT(*),
    'avg_communication', AVG(rating_communication)::numeric(3,2),
    'avg_condition', AVG(rating_product_condition)::numeric(3,2),
    'avg_punctuality', AVG(rating_punctuality)::numeric(3,2)
  )
  FROM public.product_reviews
  WHERE product_id = p_product_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_review_breakdown(uuid) TO anon, authenticated;
