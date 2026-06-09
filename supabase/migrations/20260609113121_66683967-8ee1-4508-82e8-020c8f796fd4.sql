
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS owner_popup_seen_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_rentals_owner_pending_popup
  ON public.rentals (owner_id)
  WHERE status = 'pending' AND owner_popup_seen_count < 3;

-- Increment helper (SECURITY DEFINER so it bypasses the lock_renter_rental_update trigger context).
CREATE OR REPLACE FUNCTION public.increment_owner_popup_seen(_rental_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_count integer;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.rentals
     SET owner_popup_seen_count = COALESCE(owner_popup_seen_count, 0) + 1
   WHERE id = _rental_id
     AND owner_id = uid
     AND status = 'pending'
   RETURNING owner_popup_seen_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_owner_popup_seen(uuid) TO authenticated;

-- Update list RPC: skip owner pending popups already seen 3+ times.
CREATE OR REPLACE FUNCTION public.get_rental_popups()
 RETURNS TABLE(id uuid, public_id text, mode text, outcome text, status text, start_date date, end_date date, rental_days integer, subtotal numeric, message_to_owner text, created_at timestamp with time zone, confirmed_at timestamp with time zone, counterparty_id uuid, counterparty_name text, counterparty_avatar text, product_id uuid, product_title text, product_image text, product_slug text, category_slug text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    CASE
      WHEN r.status = 'pending' THEN 'pending'
      WHEN r.status IN ('confirmed','active') AND r.renter_id = uid THEN 'confirmed'
      WHEN r.status = 'confirmed' THEN 'confirmed'
      WHEN r.status = 'cancelled' AND r.cancelled_by = r.owner_id::text THEN 'rejected'
      ELSE r.status
    END AS outcome,
    r.status,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.message_to_owner,
    r.created_at,
    r.confirmed_at,
    CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END AS counterparty_id,
    cp.full_name AS counterparty_name,
    cp.avatar_url AS counterparty_avatar,
    p.id AS product_id,
    p.title AS product_title,
    CASE WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END AS product_image,
    p.slug AS product_slug,
    p.category AS category_slug
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles cp ON cp.id = CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END
  WHERE
    (r.owner_id = uid AND r.status = 'pending' AND COALESCE(r.owner_popup_seen_count, 0) < 3)
    OR (r.renter_id = uid AND r.status IN ('confirmed','active') AND r.confirmed_at IS NOT NULL AND r.renter_seen_confirmation = false)
    OR (r.renter_id = uid AND r.status = 'cancelled' AND r.cancelled_by = r.owner_id::text AND r.renter_seen_confirmation = false)
  ORDER BY GREATEST(COALESCE(r.confirmed_at, r.created_at), COALESCE(r.created_at, r.confirmed_at)) DESC
  LIMIT 20;
END;
$function$;

-- Mirror the cap on the by-id RPC so realtime INSERT events don't bypass it on reload.
CREATE OR REPLACE FUNCTION public.get_rental_popup_by_id(_rental_id uuid)
 RETURNS TABLE(id uuid, public_id text, mode text, outcome text, status text, start_date date, end_date date, rental_days integer, subtotal numeric, message_to_owner text, created_at timestamp with time zone, confirmed_at timestamp with time zone, counterparty_id uuid, counterparty_name text, counterparty_avatar text, product_id uuid, product_title text, product_image text, product_slug text, category_slug text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    CASE
      WHEN r.status = 'pending' THEN 'pending'
      WHEN r.status IN ('confirmed','active') AND r.renter_id = uid THEN 'confirmed'
      WHEN r.status = 'confirmed' THEN 'confirmed'
      WHEN r.status = 'cancelled' AND r.cancelled_by = r.owner_id::text THEN 'rejected'
      ELSE r.status
    END AS outcome,
    r.status,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.subtotal,
    r.message_to_owner,
    r.created_at,
    r.confirmed_at,
    CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END AS counterparty_id,
    cp.full_name AS counterparty_name,
    cp.avatar_url AS counterparty_avatar,
    p.id AS product_id,
    p.title AS product_title,
    CASE WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END AS product_image,
    p.slug AS product_slug,
    p.category AS category_slug
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles cp ON cp.id = CASE WHEN r.owner_id = uid THEN r.renter_id ELSE r.owner_id END
  WHERE r.id = _rental_id
    AND (
      (r.owner_id = uid AND r.status = 'pending' AND COALESCE(r.owner_popup_seen_count, 0) < 3)
      OR (r.renter_id = uid AND r.status IN ('confirmed','active') AND r.confirmed_at IS NOT NULL AND r.renter_seen_confirmation = false)
      OR (r.renter_id = uid AND r.status = 'cancelled' AND r.cancelled_by = r.owner_id::text AND r.renter_seen_confirmation = false)
    )
  LIMIT 1;
END;
$function$;
