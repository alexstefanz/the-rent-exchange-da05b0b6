-- 1) Column-level privilege hardening (idempotent re-assert).
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number)
  ON public.products
  FROM anon, authenticated;

-- 2) Re-publish products to supabase_realtime with an explicit safe-column
--    allowlist so postgres_changes broadcasts never include sensitive cols.
DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.products';
  END IF;

  EXECUTE $sql$
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products (
      id, owner_id, title, slug, description, title_en, description_en,
      daily_price_owner, platform_fee_percent, category, subcategory,
      location_city, location_country, images, included_items,
      included_items_en, is_active, approval_status, created_at, condition,
      deposit_type, deposit_value, min_rental_days, min_rental_preset,
      max_rental_days, delivery_available, delivery_fee, delivery_radius_km,
      pickup_available, usage_rules, available_immediately, blocked_dates,
      quality_score, available_from, deleted_at
    )
  $sql$;
END
$mig$;