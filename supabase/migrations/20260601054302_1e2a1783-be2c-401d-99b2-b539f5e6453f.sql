ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS available_from date;

DROP FUNCTION IF EXISTS public.search_products(text, text, text, text, text[]);

CREATE OR REPLACE FUNCTION public.search_products(
  _search text DEFAULT NULL,
  _category text DEFAULT NULL,
  _subcategory text DEFAULT NULL,
  _location_city text DEFAULT NULL,
  _search_terms text[] DEFAULT NULL
) RETURNS TABLE(
  id uuid, owner_id uuid, title text, slug text, description text,
  title_en text, description_en text, daily_price_owner numeric,
  platform_fee_percent numeric, category text, subcategory text,
  location_city text, location_country text, images text[],
  included_items text[], included_items_en text[], is_active boolean,
  approval_status text, created_at timestamptz, condition text,
  deposit_type text, deposit_value numeric, min_rental_days integer,
  min_rental_preset text, max_rental_days integer,
  delivery_available boolean, delivery_fee numeric, delivery_radius_km integer,
  pickup_available boolean, usage_rules text[],
  available_immediately boolean, blocked_dates date[], quality_score integer,
  available_from date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.owner_id, p.title, p.slug, p.description, p.title_en, p.description_en,
    p.daily_price_owner, p.platform_fee_percent, p.category, p.subcategory,
    p.location_city, p.location_country, p.images, p.included_items, p.included_items_en,
    p.is_active, p.approval_status, p.created_at, p.condition, p.deposit_type,
    p.deposit_value, p.min_rental_days, p.min_rental_preset, p.max_rental_days,
    p.delivery_available, p.delivery_fee, p.delivery_radius_km, p.pickup_available,
    p.usage_rules, p.available_immediately, p.blocked_dates, p.quality_score,
    p.available_from
  FROM public.products p
  WHERE p.is_active = true
    AND p.approval_status = 'approved'
    AND p.deleted_at IS NULL
    AND (_category IS NULL OR p.category = _category)
    AND (_subcategory IS NULL OR p.subcategory = _subcategory)
    AND (
      _location_city IS NULL
      OR public.immutable_unaccent(lower(coalesce(p.location_city, ''))) LIKE
         ('%' || public.immutable_unaccent(lower(_location_city)) || '%')
    )
    AND (
      (_search IS NULL AND _search_terms IS NULL)
      OR (_search IS NOT NULL AND (
          public.immutable_unaccent(lower(p.title)) LIKE
             ('%' || public.immutable_unaccent(lower(_search)) || '%')
          OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
             ('%' || public.immutable_unaccent(lower(_search)) || '%')
      ))
      OR (_search_terms IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(_search_terms) AS term
          WHERE public.immutable_unaccent(lower(p.title)) LIKE
                ('%' || public.immutable_unaccent(lower(term)) || '%')
             OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
                ('%' || public.immutable_unaccent(lower(term)) || '%')
      ))
    )
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(text, text, text, text, text[])
  TO anon, authenticated;