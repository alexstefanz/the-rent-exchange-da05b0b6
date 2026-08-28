-- 1. Drop KYC-specific functions & triggers
DROP TRIGGER IF EXISTS enforce_kyc_products ON public.products;
DROP TRIGGER IF EXISTS enforce_kyc_rentals ON public.rentals;
DROP TRIGGER IF EXISTS enforce_kyc_for_actions_products ON public.products;
DROP TRIGGER IF EXISTS enforce_kyc_for_actions_rentals ON public.rentals;
DROP FUNCTION IF EXISTS public.enforce_kyc_for_actions() CASCADE;
DROP FUNCTION IF EXISTS public.detect_kyc_duplicate_names() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_kyc_case_user_immutability() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_kyc_cases_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.generate_kyc_public_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_kyc_cases(text, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_kyc_cases CASCADE;
DROP FUNCTION IF EXISTS public.get_kyc_duplicate_users CASCADE;
DROP FUNCTION IF EXISTS public.get_pv_identity_data(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.kyc_extracted_data_touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.log_kyc_activity() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_kyc_event() CASCADE;
DROP FUNCTION IF EXISTS public.notify_user_kyc_decision() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_kyc_self_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_kyc_self_privilege_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.update_kyc_cases_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_kyc_updated_at() CASCADE;

-- 2. Drop KYC data tables
DROP TABLE IF EXISTS public.kyc_audit_log CASCADE;
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.kyc_extracted_data CASCADE;
DROP TABLE IF EXISTS public.kyc_cases CASCADE;

-- 3. Recreate functions that referenced kyc_* / profile kyc columns
CREATE OR REPLACE FUNCTION public.enforce_profile_protected_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;
  new.is_banned      := old.is_banned;
  new.banned_at      := old.banned_at;
  new.banned_by      := old.banned_by;
  new.ban_reason     := old.ban_reason;
  new.phone_verified := old.phone_verified;
  new.is_deactivated := old.is_deactivated;
  new.id             := old.id;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.log_profile_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'PHONE_UPDATED', 'profile', NEW.id::text,
      jsonb_build_object('old_phone', OLD.phone, 'new_phone', NEW.phone));
  END IF;
  RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE FUNCTION public.get_admin_stats()
RETURNS TABLE(total_users bigint, total_products bigint, total_rentals bigint, active_rentals bigint, revenue_this_month numeric, total_withdrawn numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles),
    (SELECT COUNT(*) FROM products WHERE is_active = true),
    (SELECT COUNT(*) FROM rentals),
    (SELECT COUNT(*) FROM rentals WHERE status = 'active'),
    (SELECT COALESCE(SUM(platform_fee), 0) FROM rentals
     WHERE created_at >= date_trunc('month', now()) AND payment_status = 'paid'),
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'completed');
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_notification_summary();
CREATE FUNCTION public.get_admin_notification_summary()
RETURNS TABLE(unread_total bigint, pending_products bigint, open_tickets bigint, pending_withdrawals bigint, unread_high_priority bigint, pending_cancellations bigint, pending_reports bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false),
    (SELECT COUNT(*) FROM products WHERE approval_status = 'pending'),
    (SELECT COUNT(*) FROM ops_tickets
       WHERE status NOT IN ('CLOSED', 'RESOLVED')
         AND (last_admin_read_at IS NULL OR last_admin_read_at < updated_at)),
    (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'),
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false AND priority = 'high'),
    (SELECT COUNT(*) FROM rentals WHERE cancel_request_status = 'pending'),
    (SELECT COUNT(*) FROM message_reports WHERE resolved = false);
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_users(text, integer, integer, text);
CREATE FUNCTION public.get_admin_users(search_query text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0, status_filter text DEFAULT NULL::text)
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, phone text, created_at timestamp with time zone, products_count bigint, rentals_count bigint, total_earned numeric, total_spent numeric, user_role text, is_banned boolean, ban_reason text, banned_at timestamp with time zone, warnings_count bigint, last_warning_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    p.id, p.full_name, p.email, p.avatar_url, p.phone, p.created_at,
    (SELECT COUNT(*) FROM public.products pr WHERE pr.owner_id = p.id),
    (SELECT COUNT(*) FROM public.rentals r WHERE r.renter_id = p.id OR r.owner_id = p.id),
    COALESCE((SELECT SUM(r.owner_payout) FROM public.rentals r WHERE r.owner_id = p.id AND r.status = 'completed'), 0)::numeric,
    COALESCE((SELECT SUM(r.subtotal + COALESCE(r.platform_fee, 0)) FROM public.rentals r WHERE r.renter_id = p.id AND r.status IN ('completed','confirmed','active')), 0)::numeric,
    COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id LIMIT 1), 'user'),
    COALESCE(p.is_banned, false),
    p.ban_reason, p.banned_at,
    (SELECT COUNT(*) FROM public.user_warnings w WHERE w.user_id = p.id),
    (SELECT MAX(w.created_at) FROM public.user_warnings w WHERE w.user_id = p.id)
  FROM public.profiles p
  WHERE
    (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL
      OR (status_filter = 'banned' AND COALESCE(p.is_banned, false) = true)
      OR (status_filter = 'warned' AND EXISTS (SELECT 1 FROM public.user_warnings w WHERE w.user_id = p.id))
      OR (status_filter = 'active' AND COALESCE(p.is_banned, false) = false AND NOT EXISTS (SELECT 1 FROM public.user_warnings w WHERE w.user_id = p.id))
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
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
    'avg_rating', (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM product_reviews),
    'total_reviews', (SELECT COUNT(*) FROM product_reviews),
    'total_active_products', (SELECT COUNT(*) FROM products WHERE is_active = true AND approval_status = 'approved' AND deleted_at IS NULL)
  ) INTO totals;

  RETURN jsonb_build_object('recent_rentals', recent_rentals, 'totals', totals);
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
  FROM public.product_reviews pr JOIN public.products p ON p.id = pr.product_id
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

DROP FUNCTION IF EXISTS public.get_rental_full_detail(text);
CREATE FUNCTION public.get_rental_full_detail(_public_id text)
RETURNS TABLE(id uuid, public_id text, status text, payment_status text, rejection_reason text, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, pickup_location text, pickup_time timestamp with time zone, handover_confirmed_at timestamp with time zone, return_confirmed_at timestamp with time zone, cancelled_at timestamp with time zone, completed_at timestamp with time zone, dispute_status text, early_return_status text, is_test_payment boolean, created_at timestamp with time zone, product_id uuid, product_title text, product_image text, product_category text, product_included_items text[], product_deposit_value numeric, product_location_city text, owner_id uuid, owner_name text, owner_email text, owner_phone text, renter_id uuid, renter_name text, renter_email text, renter_phone text, handover_pv_generated_at timestamp with time zone, handover_pv_owner_signed_at timestamp with time zone, handover_pv_renter_signed_at timestamp with time zone, return_pv_generated_at timestamp with time zone, return_pv_owner_signed_at timestamp with time zone, return_pv_renter_signed_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _rental_id uuid;
  _allowed boolean;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT r.id INTO _rental_id FROM public.rentals r WHERE r.public_id = _public_id;
  IF _rental_id IS NULL THEN RETURN; END IF;
  SELECT (public.has_role(_uid,'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.rentals r WHERE r.id = _rental_id AND (r.renter_id = _uid OR r.owner_id = _uid)
  )) INTO _allowed;
  IF NOT _allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN QUERY
  SELECT
    r.id, r.public_id, r.status, r.payment_status, r.rejection_reason,
    r.start_date, r.end_date, r.rental_days, r.daily_price, r.subtotal, r.platform_fee, r.owner_payout,
    r.pickup_location, r.pickup_time,
    r.handover_confirmed_at, r.return_confirmed_at, r.cancelled_at, r.completed_at,
    r.dispute_status, r.early_return_status, r.is_test_payment, r.created_at,
    p.id, p.title, COALESCE(p.images[1], NULL::text), p.category, p.included_items, p.deposit_value, p.location_city,
    op.id, op.full_name, op.email, op.phone,
    rp.id, rp.full_name, rp.email, rp.phone,
    hpv.generated_at, hpv.owner_signed_at, hpv.renter_signed_at,
    retpv.generated_at, retpv.owner_signed_at, retpv.renter_signed_at
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles op ON op.id = r.owner_id
  LEFT JOIN public.profiles rp ON rp.id = r.renter_id
  LEFT JOIN public.rental_pv_documents hpv ON hpv.rental_id = r.id AND hpv.phase = 'handover'
  LEFT JOIN public.rental_pv_documents retpv ON retpv.rental_id = r.id AND retpv.phase = 'return'
  WHERE r.id = _rental_id;
END $function$;

-- 4. Drop KYC columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS kyc_status,
  DROP COLUMN IF EXISTS kyc_level,
  DROP COLUMN IF EXISTS kyc_last_verified_at;