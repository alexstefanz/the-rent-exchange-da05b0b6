CREATE OR REPLACE FUNCTION public.get_product_extended_stats(p_product_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_times_rented int;
  v_last_booking_at timestamptz;
  v_watchers_count int;
  v_views_count int;
  v_owner_total_rentals int;
  v_owner_response_minutes numeric;
  v_owner_response_rate numeric;
  v_owner_member_since timestamptz;
  v_owner_avg_rating numeric;
  v_owner_review_count int;
  v_owner_kyc_level text;
  v_owner_kyc_status text;
  v_owner_kyc_verified boolean;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.products WHERE id = p_product_id;
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'product_not_found');
  END IF;

  SELECT COUNT(*), MAX(confirmed_at)
    INTO v_times_rented, v_last_booking_at
  FROM public.rentals
  WHERE product_id = p_product_id
    AND status IN ('confirmed', 'active', 'completed');

  SELECT COUNT(*) INTO v_watchers_count
  FROM public.favorite_products
  WHERE product_id = p_product_id;

  SELECT COUNT(*) INTO v_views_count
  FROM public.product_views
  WHERE product_id = p_product_id;

  SELECT COUNT(*) INTO v_owner_total_rentals
  FROM public.rentals
  WHERE owner_id = v_owner_id AND status = 'completed';

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

  SELECT created_at, kyc_level, kyc_status
    INTO v_owner_member_since, v_owner_kyc_level, v_owner_kyc_status
  FROM public.profiles WHERE id = v_owner_id;

  v_owner_kyc_verified := COALESCE(v_owner_kyc_status, '') IN ('APPROVED', 'VERIFIED')
    OR COALESCE(v_owner_kyc_level, '') IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

  SELECT AVG(pr.rating), COUNT(*)
    INTO v_owner_avg_rating, v_owner_review_count
  FROM public.product_reviews pr
  JOIN public.products p ON p.id = pr.product_id
  WHERE p.owner_id = v_owner_id;

  RETURN jsonb_build_object(
    'times_rented', COALESCE(v_times_rented, 0),
    'last_booking_at', v_last_booking_at,
    'watchers_count', COALESCE(v_watchers_count, 0),
    'views_count', COALESCE(v_views_count, 0),
    'owner_total_rentals', COALESCE(v_owner_total_rentals, 0),
    'owner_response_minutes', v_owner_response_minutes,
    'owner_response_rate', v_owner_response_rate,
    'owner_member_since', v_owner_member_since,
    'owner_avg_rating', v_owner_avg_rating,
    'owner_review_count', COALESCE(v_owner_review_count, 0),
    'owner_kyc_verified', v_owner_kyc_verified
  );
END;
$function$;