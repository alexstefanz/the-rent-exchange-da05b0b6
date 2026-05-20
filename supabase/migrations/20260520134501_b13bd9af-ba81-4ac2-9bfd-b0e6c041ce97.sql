CREATE OR REPLACE FUNCTION public.search_products(_search text DEFAULT NULL::text, _category text DEFAULT NULL::text, _subcategory text DEFAULT NULL::text, _location_city text DEFAULT NULL::text)
 RETURNS SETOF products
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT p.*
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
      _search IS NULL
      OR public.immutable_unaccent(lower(p.title)) LIKE
         ('%' || public.immutable_unaccent(lower(_search)) || '%')
      OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
         ('%' || public.immutable_unaccent(lower(_search)) || '%')
    )
  ORDER BY p.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.search_products(_search text DEFAULT NULL::text, _category text DEFAULT NULL::text, _subcategory text DEFAULT NULL::text, _location_city text DEFAULT NULL::text, _search_terms text[] DEFAULT NULL::text[])
 RETURNS SETOF products
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT p.*
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
      (_search IS NULL AND (_search_terms IS NULL OR array_length(_search_terms, 1) IS NULL))
      OR (
        _search IS NOT NULL AND (
          public.immutable_unaccent(lower(p.title)) LIKE
            ('%' || public.immutable_unaccent(lower(_search)) || '%')
          OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
            ('%' || public.immutable_unaccent(lower(_search)) || '%')
        )
      )
      OR (
        _search_terms IS NOT NULL AND EXISTS (
          SELECT 1
          FROM unnest(_search_terms) AS term
          WHERE public.immutable_unaccent(lower(p.title)) LIKE
                ('%' || public.immutable_unaccent(lower(term)) || '%')
             OR public.immutable_unaccent(lower(coalesce(p.description, ''))) LIKE
                ('%' || public.immutable_unaccent(lower(term)) || '%')
        )
      )
    )
  ORDER BY p.created_at DESC;
$function$;