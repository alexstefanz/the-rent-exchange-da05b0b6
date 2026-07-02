
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number) ON public.products FROM anon;
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number) ON public.products FROM authenticated;
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number) ON public.products FROM PUBLIC;

GRANT SELECT (
  id, owner_id, title, description, daily_price_owner, platform_fee_percent,
  category, subcategory, location_city, location_country, images, is_active,
  created_at, slug, admin_flagged, flag_reason, included_items, approval_status,
  admin_edited_at, admin_edited_by, title_en, description_en, deleted_at, deleted_by,
  condition, deposit_type, deposit_value, min_rental_days, min_rental_preset,
  delivery_available, delivery_fee, delivery_radius_km, pickup_available,
  usage_rules, available_immediately, blocked_dates, quality_score,
  max_rental_days, included_items_en, available_from
) ON public.products TO anon, authenticated;

GRANT ALL ON public.products TO service_role;
