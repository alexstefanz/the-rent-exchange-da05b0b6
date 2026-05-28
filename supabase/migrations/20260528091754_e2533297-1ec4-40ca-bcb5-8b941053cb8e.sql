-- Re-publish products with a safe column list, excluding sensitive fields
ALTER PUBLICATION supabase_realtime DROP TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products
  (id, owner_id, title, description, daily_price_owner, platform_fee_percent,
   category, subcategory, location_city, location_country, images, is_active,
   created_at, slug, included_items, approval_status, title_en, description_en,
   deleted_at, deleted_by, condition, deposit_type, deposit_value,
   min_rental_days, min_rental_preset, delivery_available, delivery_fee,
   delivery_radius_km, pickup_available, usage_rules, available_immediately,
   blocked_dates, quality_score, max_rental_days, included_items_en);