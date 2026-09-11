ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'web';
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'web';
ALTER TABLE public.ops_tickets ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'web';

ALTER TABLE public.products ADD CONSTRAINT products_created_via_check CHECK (created_via IN ('web','mobile'));
ALTER TABLE public.rentals ADD CONSTRAINT rentals_created_via_check CHECK (created_via IN ('web','mobile'));
ALTER TABLE public.ops_tickets ADD CONSTRAINT ops_tickets_created_via_check CHECK (created_via IN ('web','mobile'));

CREATE INDEX IF NOT EXISTS idx_products_created_via ON public.products(created_via);
CREATE INDEX IF NOT EXISTS idx_rentals_created_via ON public.rentals(created_via);
CREATE INDEX IF NOT EXISTS idx_ops_tickets_created_via ON public.ops_tickets(created_via);

CREATE OR REPLACE FUNCTION public.set_created_via()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hdrs json;
  platform text;
BEGIN
  BEGIN
    hdrs := current_setting('request.headers', true)::json;
  EXCEPTION WHEN others THEN
    hdrs := NULL;
  END;

  platform := lower(COALESCE(hdrs ->> 'x-client-platform', ''));

  IF platform = 'mobile' THEN
    NEW.created_via := 'mobile';
  ELSE
    NEW.created_via := 'web';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_products_created_via ON public.products;
CREATE TRIGGER tg_products_created_via BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_created_via();

DROP TRIGGER IF EXISTS tg_rentals_created_via ON public.rentals;
CREATE TRIGGER tg_rentals_created_via BEFORE INSERT ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.set_created_via();

DROP TRIGGER IF EXISTS tg_ops_tickets_created_via ON public.ops_tickets;
CREATE TRIGGER tg_ops_tickets_created_via BEFORE INSERT ON public.ops_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_created_via();

CREATE OR REPLACE FUNCTION public.get_admin_products(search_query text DEFAULT NULL::text, status_filter text DEFAULT NULL::text, category_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0, created_via_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, description text, category text, subcategory text, daily_price_owner numeric, location_city text, images text[], is_active boolean, admin_flagged boolean, flag_reason text, owner_id uuid, owner_name text, slug text, created_at timestamp with time zone, approval_status text, admin_edited_at timestamp with time zone, admin_edited_by uuid, created_via text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id, p.title, p.description, p.category, p.subcategory,
    p.daily_price_owner, p.location_city, p.images, p.is_active,
    p.admin_flagged, p.flag_reason, p.owner_id,
    COALESCE(pr.full_name, 'Utilizator') as owner_name,
    p.slug, p.created_at, p.approval_status,
    p.admin_edited_at, p.admin_edited_by, p.created_via
  FROM products p
  LEFT JOIN profiles pr ON pr.id = p.owner_id
  WHERE 
    p.deleted_at IS NULL
    AND (search_query IS NULL OR p.title ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL 
      OR (status_filter = 'active' AND p.is_active = true AND p.admin_flagged = false)
      OR (status_filter = 'inactive' AND p.is_active = false)
      OR (status_filter = 'flagged' AND p.admin_flagged = true)
      OR (status_filter = 'pending' AND p.approval_status = 'pending')
      OR (status_filter = 'rejected' AND p.approval_status = 'rejected')
    )
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (created_via_filter IS NULL OR p.created_via = created_via_filter)
  ORDER BY 
    CASE WHEN p.approval_status = 'pending' THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_rentals(status_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0, created_via_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, public_id text, product_id uuid, product_title text, renter_id uuid, renter_name text, owner_id uuid, owner_name text, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, status text, payment_status text, created_at timestamp with time zone, category text, location_city text, created_via text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.public_id,
    r.product_id,
    COALESCE(p.title, 'Produs șters') AS product_title,
    r.renter_id,
    COALESCE(renter.full_name, 'Utilizator') AS renter_name,
    r.owner_id,
    COALESCE(owner.full_name, 'Utilizator') AS owner_name,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.daily_price,
    r.subtotal,
    r.platform_fee,
    r.owner_payout,
    r.status,
    r.payment_status,
    r.created_at,
    COALESCE(p.category, '-') AS category,
    COALESCE(p.location_city, '-') AS location_city,
    r.created_via
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles renter ON renter.id = r.renter_id
  LEFT JOIN public.profiles owner ON owner.id = r.owner_id
  WHERE (status_filter IS NULL OR r.status = status_filter)
    AND (created_via_filter IS NULL OR r.created_via = created_via_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;