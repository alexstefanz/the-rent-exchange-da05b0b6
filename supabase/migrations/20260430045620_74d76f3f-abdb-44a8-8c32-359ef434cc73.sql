-- Immutable wrapper around unaccent so it can be used in indexes
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$;

-- Trigram index on unaccented lowercased title for fast diacritic-insensitive search
CREATE INDEX IF NOT EXISTS idx_products_title_unaccent_trgm
  ON public.products
  USING gin (public.immutable_unaccent(lower(title)) gin_trgm_ops);

-- Optional: index on description as well (used by search)
CREATE INDEX IF NOT EXISTS idx_products_description_unaccent_trgm
  ON public.products
  USING gin (public.immutable_unaccent(lower(coalesce(description, ''))) gin_trgm_ops);

-- Search function that normalizes diacritics on both column and query
CREATE OR REPLACE FUNCTION public.search_products(
  _search text DEFAULT NULL,
  _category text DEFAULT NULL,
  _subcategory text DEFAULT NULL,
  _location_city text DEFAULT NULL
)
RETURNS SETOF public.products
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.products p
  WHERE p.is_active = true
    AND p.approval_status = 'approved'
    AND (_category IS NULL OR p.category = _category)
    AND (_subcategory IS NULL OR p.subcategory = _subcategory)
    AND (
      _location_city IS NULL
      OR public.immutable_unaccent(lower(coalesce(p.location_city, ''))) LIKE
         ('%' || public.immutable_unaccent(lower(_location_city)) || '%')
    )
    AND (
      _search IS NULL
      OR public.immutable_unaccent(lower(p.title)) LIKE
         ('%' || public.immutable_unaccent(lower(_search)) || '%')
      OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
         ('%' || public.immutable_unaccent(lower(_search)) || '%')
    )
  ORDER BY p.created_at DESC;
$$;