CREATE OR REPLACE FUNCTION public.get_user_statistics(target_user_id uuid)
RETURNS TABLE(products_count bigint, member_since timestamp with time zone, average_rating numeric, reviews_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH all_reviews AS (
    SELECT rating FROM user_reviews WHERE reviewed_user_id = target_user_id
    UNION ALL
    SELECT pr.rating FROM product_reviews pr
    JOIN products p ON p.id = pr.product_id
    WHERE p.owner_id = target_user_id
  )
  SELECT 
    (SELECT COUNT(*) FROM products WHERE owner_id = target_user_id AND is_active = true),
    (SELECT created_at FROM profiles WHERE id = target_user_id),
    COALESCE((SELECT AVG(rating)::numeric FROM all_reviews), 0),
    (SELECT COUNT(*) FROM all_reviews);
$$;