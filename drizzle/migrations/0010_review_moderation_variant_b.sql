-- Review moderation (Variant B) + contact-info blocking
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid;
ALTER TABLE public.user_reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid;
ALTER TABLE public.product_reviews ADD CONSTRAINT product_reviews_status_check CHECK (status IN ('approved','pending_review','rejected'));
ALTER TABLE public.user_reviews ADD CONSTRAINT user_reviews_status_check CHECK (status IN ('approved','pending_review','rejected'));
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_user_reviews_status ON public.user_reviews(status);

CREATE OR REPLACE FUNCTION public.review_contains_contact(_t text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _t IS NOT NULL AND (
    _t ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    OR _t ~* '(https?://|www\.)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}'
    OR _t ~* '\m[a-z0-9-]{2,}\.(ro|com|net|org|eu|io|co|uk|de|fr|it|es|info|biz|shop|store|online|app|dev)\M'
    OR _t ~ '(^|[^0-9A-Za-z])(\+40|0040|0)([\s().-]*[0-9]){9}([^0-9]|$)'
    OR (_t ~* '(suna|sună|apel|sms|whats ?app|telefon|tel\.|contact|call)'
        AND _t ~ '[0-9]([\s().-]*[0-9]){7,14}')
  );
$$;

CREATE OR REPLACE FUNCTION public.moderate_review_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  disputed boolean := false;
BEGIN
  IF public.review_contains_contact(NEW.comment) THEN
    RAISE EXCEPTION 'CONTACT_BLOCKED: review contains contact information'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.rental_id IS NOT NULL THEN
    SELECT (r.dispute_status IS NOT NULL AND r.dispute_status <> 'none')
      INTO disputed FROM public.rentals r WHERE r.id = NEW.rental_id;
  END IF;

  IF NEW.rating <= 3 OR COALESCE(disputed, false) THEN
    NEW.status := 'pending_review';
    NEW.moderation_reason := CASE WHEN COALESCE(disputed,false) THEN 'dispute' ELSE 'low_rating' END;
  ELSE
    NEW.status := 'approved';
    NEW.moderation_reason := NULL;
  END IF;
  NEW.moderated_at := NULL;
  NEW.moderated_by := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_moderate_product_review BEFORE INSERT OR UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.moderate_review_before_write();
CREATE TRIGGER trg_moderate_user_review BEFORE INSERT OR UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.moderate_review_before_write();

DROP POLICY IF EXISTS "Anyone can view product reviews" ON public.product_reviews;
CREATE POLICY "View approved or own product reviews" ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update product reviews" ON public.product_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.user_reviews;
CREATE POLICY "View approved or own user reviews" ON public.user_reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update user reviews" ON public.user_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.admin_moderate_review(_table text, _id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _table = 'product' THEN
    UPDATE public.product_reviews SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      moderated_at = now(), moderated_by = auth.uid(),
      moderation_reason = COALESCE(_note, moderation_reason) WHERE id = _id;
  ELSIF _table = 'user' THEN
    UPDATE public.user_reviews SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      moderated_at = now(), moderated_by = auth.uid(),
      moderation_reason = COALESCE(_note, moderation_reason) WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'Invalid table';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_moderate_review(text, uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_review(text, uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_product_review_breakdown(p_product_id uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'avg_rating', COALESCE(AVG(rating)::numeric(3,2), 0),
    'count', COUNT(*),
    'avg_communication', AVG(rating_communication)::numeric(3,2),
    'avg_condition', AVG(rating_product_condition)::numeric(3,2),
    'avg_punctuality', AVG(rating_punctuality)::numeric(3,2)
  )
  FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') product_reviews
  WHERE product_id = p_product_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_homepage_popular_products(_limit integer DEFAULT 8)
 RETURNS SETOF products LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
        SELECT COUNT(*) FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') pr WHERE pr.product_id = p.id
      ), 0) AS review_count,
      COALESCE((
        SELECT AVG(pr.rating) FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') pr WHERE pr.product_id = p.id
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
    SELECT * FROM ordered WHERE cat_rank <= max_per_cat
    ORDER BY score DESC, created_at DESC
    LIMIT _limit
  ),
  final_ids AS (
    SELECT id FROM diversified
    UNION
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
$function$;

CREATE OR REPLACE FUNCTION public.get_product_extended_stats(p_product_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.products WHERE id = p_product_id;
  IF v_owner_id IS NULL THEN RETURN jsonb_build_object('error', 'product_not_found'); END IF;

  SELECT COUNT(*), MAX(confirmed_at) INTO v_times_rented, v_last_booking_at
  FROM public.rentals WHERE product_id = p_product_id AND status IN ('confirmed','active','completed');

  SELECT COUNT(*) INTO v_watchers_count FROM public.favorite_products WHERE product_id = p_product_id;
  SELECT COUNT(*) INTO v_views_count FROM public.product_views WHERE product_id = p_product_id;
  SELECT COUNT(*) INTO v_owner_total_rentals FROM public.rentals WHERE owner_id = v_owner_id AND status = 'completed';

  WITH conv AS (
    SELECT c.id, c.created_at,
      (SELECT MIN(m.created_at) FROM public.messages m WHERE m.conversation_id = c.id AND m.sender_id = c.owner_id) AS first_reply_at,
      (SELECT MIN(m.created_at) FROM public.messages m WHERE m.conversation_id = c.id AND m.sender_id = c.buyer_id) AS first_buyer_at
    FROM public.conversations c WHERE c.owner_id = v_owner_id
    ORDER BY c.created_at DESC LIMIT 200
  )
  SELECT
    AVG(EXTRACT(EPOCH FROM (first_reply_at - first_buyer_at)) / 60.0)
      FILTER (WHERE first_reply_at IS NOT NULL AND first_buyer_at IS NOT NULL AND first_reply_at >= first_buyer_at),
    CASE WHEN COUNT(*) FILTER (WHERE first_buyer_at IS NOT NULL) > 0
         THEN COUNT(*) FILTER (WHERE first_reply_at IS NOT NULL AND first_buyer_at IS NOT NULL)::numeric * 100
              / COUNT(*) FILTER (WHERE first_buyer_at IS NOT NULL)
         ELSE NULL END
  INTO v_owner_response_minutes, v_owner_response_rate FROM conv;

  SELECT created_at INTO v_owner_member_since FROM public.profiles WHERE id = v_owner_id;

  SELECT AVG(pr.rating), COUNT(*) INTO v_owner_avg_rating, v_owner_review_count
  FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') pr JOIN public.products p ON p.id = pr.product_id
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
    'owner_review_count', COALESCE(v_owner_review_count, 0)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_statistics(target_user_id uuid)
 RETURNS TABLE(products_count bigint, member_since timestamp with time zone, average_rating numeric, reviews_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH all_reviews AS (
    SELECT rating FROM (SELECT * FROM public.user_reviews WHERE status = 'approved') user_reviews WHERE reviewed_user_id = target_user_id
    UNION ALL
    SELECT pr.rating FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') pr
    JOIN products p ON p.id = pr.product_id
    WHERE p.owner_id = target_user_id
  )
  SELECT 
    (SELECT COUNT(*) FROM products WHERE owner_id = target_user_id AND is_active = true),
    (SELECT created_at FROM profiles WHERE id = target_user_id),
    COALESCE((SELECT AVG(rating)::numeric FROM all_reviews), 0),
    (SELECT COUNT(*) FROM all_reviews);
$function$;

CREATE OR REPLACE FUNCTION public.get_homepage_activity()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  recent_rentals jsonb;
  totals jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO recent_rentals
  FROM (
    SELECT
      p.title AS product_title, p.title_en AS product_title_en,
      COALESCE(p.images[1], NULL) AS product_image,
      p.location_city AS city, p.slug AS product_slug,
      EXTRACT(EPOCH FROM (now() - r.confirmed_at))::int AS time_ago_seconds
    FROM rentals r
    JOIN products p ON p.id = r.product_id
    WHERE r.status IN ('confirmed','active','completed')
      AND r.confirmed_at IS NOT NULL
      AND r.confirmed_at > now() - interval '7 days'
      AND p.is_active = true AND p.deleted_at IS NULL
    ORDER BY r.confirmed_at DESC LIMIT 5
  ) r;

  SELECT jsonb_build_object(
    'verified_users', (SELECT COUNT(*) FROM profiles WHERE COALESCE(phone_verified,false) = true AND COALESCE(is_banned,false) = false AND COALESCE(is_deactivated,false) = false),
    'avg_rating', (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') product_reviews),
    'total_reviews', (SELECT COUNT(*) FROM (SELECT * FROM public.product_reviews WHERE status = 'approved') product_reviews),
    'total_active_products', (SELECT COUNT(*) FROM products WHERE is_active = true AND approval_status = 'approved' AND deleted_at IS NULL)
  ) INTO totals;

  RETURN jsonb_build_object('recent_rentals', recent_rentals, 'totals', totals);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_reviews_with_reviewers(target_user_id uuid)
 RETURNS TABLE(id uuid, reviewer_id uuid, reviewed_user_id uuid, rating integer, comment text, created_at timestamp with time zone, reviewer_full_name text, reviewer_avatar_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT ur.id, ur.reviewer_id, ur.reviewed_user_id, ur.rating, ur.comment, ur.created_at,
    p.full_name as reviewer_full_name, p.avatar_url as reviewer_avatar_url
  FROM (SELECT * FROM public.user_reviews WHERE status = 'approved') ur
  LEFT JOIN profiles p ON p.id = ur.reviewer_id
  WHERE ur.reviewed_user_id = target_user_id
  ORDER BY ur.created_at DESC;
$function$;