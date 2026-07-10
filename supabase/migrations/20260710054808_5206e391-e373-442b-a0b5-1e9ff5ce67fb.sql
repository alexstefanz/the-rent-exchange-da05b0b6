
CREATE OR REPLACE FUNCTION public.get_homepage_popular_products(_limit int DEFAULT 8)
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_per_cat int := 2;
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      p.*,
      COALESCE((
        SELECT COUNT(*) FROM rentals r
        WHERE r.product_id = p.id
          AND r.status IN ('confirmed','active','completed')
          AND r.created_at > now() - interval '90 days'
      ), 0) AS recent_rentals,
      COALESCE((
        SELECT COUNT(*) FROM rentals r WHERE r.product_id = p.id
      ), 0) AS total_rentals,
      COALESCE((
        SELECT COUNT(*) FROM product_reviews pr WHERE pr.product_id = p.id
      ), 0) AS review_count,
      COALESCE((
        SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id
      ), 0) AS avg_rating
    FROM products p
    WHERE p.deleted_at IS NULL
      AND p.is_active = true
      AND p.approval_status = 'approved'
  ),
  ranked AS (
    SELECT s.*,
      (s.recent_rentals * 3
       + s.total_rentals * 1
       + s.review_count * 2
       + s.avg_rating * 1)::numeric AS score
    FROM scored s
  ),
  ordered AS (
    SELECT r.*,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(r.category, '__none__')
        ORDER BY r.score DESC, r.created_at DESC
      ) AS cat_rank,
      ROW_NUMBER() OVER (ORDER BY r.score DESC, r.created_at DESC) AS global_rank
    FROM ranked r
  ),
  diversified AS (
    -- First pass: at most max_per_cat products per category
    SELECT * FROM ordered WHERE cat_rank <= max_per_cat
    ORDER BY score DESC, created_at DESC
    LIMIT _limit
  ),
  final_ids AS (
    SELECT id FROM diversified
    UNION
    -- Fill up if diversified didn't yield enough
    SELECT id FROM ordered
    WHERE id NOT IN (SELECT id FROM diversified)
    ORDER BY 1
    LIMIT _limit
  )
  SELECT p.*
  FROM products p
  JOIN ordered o ON o.id = p.id
  WHERE p.id IN (SELECT id FROM final_ids)
  ORDER BY o.score DESC, o.created_at DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_homepage_popular_products(int) TO anon, authenticated;
