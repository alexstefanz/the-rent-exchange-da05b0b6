CREATE OR REPLACE FUNCTION public.get_rental_popups()
RETURNS TABLE(
  id uuid,
  public_id text,
  mode text,
  status text,
  start_date date,
  end_date date,
  rental_days integer,
  subtotal numeric,
  message_to_owner text,
  created_at timestamptz,
  confirmed_at timestamptz,
  counterparty_id uuid,
  counterparty_name text,
  counterparty_avatar text,
  product_id uuid,
  product_title text,
  product_image text,
  product_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.public_id,
    CASE WHEN r.owner_id = uid THEN 'owner' ELSE 'renter' END AS mode,
    r.status,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.message_to_owner,
    r.created_at,
    r.confirmed_at,
    COALESCE(NULLIF(CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END, NULL), NULL) AS counterparty_id,
    cp.full_name AS counterparty_name,
    cp.avatar_url AS counterparty_avatar,
    p.id AS product_id,
    p.title AS product_title,
    CASE WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END AS product_image,
    p.slug AS product_slug
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles cp ON cp.id = CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END
  WHERE
    (r.owner_id = uid AND r.status = 'pending')
    OR (r.renter_id = uid AND r.status = 'confirmed' AND r.renter_seen_confirmation = false)
  ORDER BY GREATEST(COALESCE(r.confirmed_at, r.created_at), COALESCE(r.created_at, r.confirmed_at)) DESC
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.get_rental_popups() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_popups() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_rental_popup_by_id(_rental_id uuid)
RETURNS TABLE(
  id uuid,
  public_id text,
  mode text,
  status text,
  start_date date,
  end_date date,
  rental_days integer,
  subtotal numeric,
  message_to_owner text,
  created_at timestamptz,
  confirmed_at timestamptz,
  counterparty_id uuid,
  counterparty_name text,
  counterparty_avatar text,
  product_id uuid,
  product_title text,
  product_image text,
  product_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.public_id,
    CASE WHEN r.owner_id = uid THEN 'owner' ELSE 'renter' END AS mode,
    r.status,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.message_to_owner,
    r.created_at,
    r.confirmed_at,
    CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END AS counterparty_id,
    cp.full_name,
    cp.avatar_url,
    p.id,
    p.title,
    CASE WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END,
    p.slug
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles cp ON cp.id = CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END
  WHERE r.id = _rental_id
    AND (r.owner_id = uid OR r.renter_id = uid);
END;
$$;

REVOKE ALL ON FUNCTION public.get_rental_popup_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rental_popup_by_id(uuid) TO authenticated;