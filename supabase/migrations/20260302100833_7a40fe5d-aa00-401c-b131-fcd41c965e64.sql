
CREATE OR REPLACE FUNCTION public.get_user_given_reviews_with_targets(target_user_id uuid)
RETURNS TABLE(id uuid, reviewer_id uuid, reviewed_user_id uuid, rating integer, comment text, created_at timestamp with time zone, reviewed_full_name text, reviewed_avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ur.id,
    ur.reviewer_id,
    ur.reviewed_user_id,
    ur.rating,
    ur.comment,
    ur.created_at,
    p.full_name as reviewed_full_name,
    p.avatar_url as reviewed_avatar_url
  FROM user_reviews ur
  LEFT JOIN profiles p ON p.id = ur.reviewed_user_id
  WHERE ur.reviewer_id = target_user_id
  ORDER BY ur.created_at DESC;
$$;
