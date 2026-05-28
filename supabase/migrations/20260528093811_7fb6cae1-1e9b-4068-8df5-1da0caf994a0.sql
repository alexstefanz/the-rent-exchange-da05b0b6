-- 1) Column-level REVOKE: hide sensitive product columns from direct REST reads
REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number,
               admin_flagged, flag_reason, admin_edited_at, admin_edited_by)
  ON public.products FROM anon, authenticated;

-- 2) Rebuild search_products to return only safe columns under SECURITY DEFINER
DROP FUNCTION IF EXISTS public.search_products(text, text, text, text);
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
  available_immediately boolean, blocked_dates date[], quality_score integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.owner_id, p.title, p.slug, p.description, p.title_en, p.description_en,
    p.daily_price_owner, p.platform_fee_percent, p.category, p.subcategory,
    p.location_city, p.location_country, p.images, p.included_items, p.included_items_en,
    p.is_active, p.approval_status, p.created_at, p.condition, p.deposit_type,
    p.deposit_value, p.min_rental_days, p.min_rental_preset, p.max_rental_days,
    p.delivery_available, p.delivery_fee, p.delivery_radius_km, p.pickup_available,
    p.usage_rules, p.available_immediately, p.blocked_dates, p.quality_score
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

-- 3) Owner/admin helpers for sensitive fields

CREATE OR REPLACE FUNCTION public.get_product_sensitive_fields(_id uuid)
RETURNS TABLE(
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  serial_number text,
  admin_flagged boolean,
  flag_reason text,
  admin_edited_at timestamptz,
  admin_edited_by uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.pickup_address, p.pickup_lat, p.pickup_lng, p.serial_number,
         p.admin_flagged, p.flag_reason, p.admin_edited_at, p.admin_edited_by
  FROM public.products p
  WHERE p.id = _id
    AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;
GRANT EXECUTE ON FUNCTION public.get_product_sensitive_fields(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_products_sensitive()
RETURNS TABLE(
  id uuid,
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  serial_number text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.pickup_address, p.pickup_lat, p.pickup_lng, p.serial_number
  FROM public.products p
  WHERE p.owner_id = auth.uid()
    AND p.deleted_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_products_sensitive() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_products_sensitive(_ids uuid[])
RETURNS TABLE(
  id uuid,
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  serial_number text,
  admin_flagged boolean,
  flag_reason text,
  admin_edited_at timestamptz,
  admin_edited_by uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.pickup_address, p.pickup_lat, p.pickup_lng, p.serial_number,
         p.admin_flagged, p.flag_reason, p.admin_edited_at, p.admin_edited_by
  FROM public.products p
  WHERE p.id = ANY(_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_products_sensitive(uuid[]) TO authenticated;

-- 4) Admin full-details helper (replaces direct select of pickup_address in admin UI)
CREATE OR REPLACE FUNCTION public.get_admin_product_full_details(_id uuid)
RETURNS TABLE(
  description text,
  included_items text[],
  location_country text,
  pickup_address text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.description, p.included_items, p.location_country, p.pickup_address
  FROM public.products p
  WHERE p.id = _id
    AND public.has_role(auth.uid(), 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_product_full_details(uuid) TO authenticated;