
CREATE OR REPLACE FUNCTION public.get_admin_sms_logs(
  status_filter text DEFAULT NULL,
  search_query text DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  user_id uuid,
  user_name text,
  user_email text,
  rental_id uuid,
  product_title text,
  recipient_phone text,
  template_key text,
  message_body text,
  status text,
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  idempotency_key text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.created_at,
    s.user_id,
    COALESCE(p.full_name, '—') AS user_name,
    COALESCE(p.email, '') AS user_email,
    s.rental_id,
    COALESCE(prod.title, '') AS product_title,
    s.recipient_phone,
    s.template_key,
    s.message_body,
    s.status,
    s.provider_message_id,
    s.provider_response,
    s.error_message,
    s.idempotency_key
  FROM public.sms_logs s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.rentals r ON r.id = s.rental_id
  LEFT JOIN public.products prod ON prod.id = r.product_id
  WHERE
    (status_filter IS NULL OR s.status = status_filter)
    AND (date_from IS NULL OR s.created_at >= date_from)
    AND (date_to IS NULL OR s.created_at <= date_to)
    AND (
      search_query IS NULL
      OR s.recipient_phone ILIKE '%' || search_query || '%'
      OR s.template_key ILIKE '%' || search_query || '%'
      OR p.full_name ILIKE '%' || search_query || '%'
      OR p.email ILIKE '%' || search_query || '%'
      OR prod.title ILIKE '%' || search_query || '%'
      OR s.rental_id::text = search_query
    )
  ORDER BY s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
