

## Plan: Fix user statistics to include product reviews

### Problem
The `get_user_statistics` database function only queries `user_reviews` table for rating/count. Product reviews (stored in `product_reviews`) where the user is the product owner are not counted. So "Tilihi Andrei" has a product review but his profile shows "Fără recenzii" and rating N/A.

### Solution — Update the database function

Create a migration to replace `get_user_statistics` so it combines both review sources:

```sql
CREATE OR REPLACE FUNCTION get_user_statistics(target_user_id uuid)
RETURNS TABLE(products_count bigint, member_since timestamptz, average_rating numeric, reviews_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH all_reviews AS (
    -- User reviews (direct user-to-user)
    SELECT rating FROM user_reviews WHERE reviewed_user_id = target_user_id
    UNION ALL
    -- Product reviews where target user is the product owner
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
```

### Files changed
- **1 new migration** — `CREATE OR REPLACE FUNCTION get_user_statistics` to combine `user_reviews` + `product_reviews` (owner's products)

No frontend code changes needed — the existing `useUserStatistics` hook and `OwnerSection` component already handle the data correctly; they just need real numbers from the database.

