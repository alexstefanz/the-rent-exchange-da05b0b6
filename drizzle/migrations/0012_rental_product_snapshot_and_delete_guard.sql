ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS product_title_snapshot text, ADD COLUMN IF NOT EXISTS product_image_snapshot text;

UPDATE public.rentals r SET product_title_snapshot = p.title, product_image_snapshot = p.images[1]
FROM public.products p WHERE p.id = r.product_id AND r.product_title_snapshot IS NULL;

CREATE OR REPLACE FUNCTION public.set_rental_product_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.product_id IS NOT NULL AND (NEW.product_title_snapshot IS NULL OR NEW.product_image_snapshot IS NULL) THEN
    SELECT COALESCE(NEW.product_title_snapshot, p.title), COALESCE(NEW.product_image_snapshot, p.images[1])
      INTO NEW.product_title_snapshot, NEW.product_image_snapshot
      FROM public.products p WHERE p.id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rental_product_snapshot ON public.rentals;
CREATE TRIGGER trg_rental_product_snapshot BEFORE INSERT ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.set_rental_product_snapshot();

CREATE OR REPLACE FUNCTION public.prevent_product_delete_with_active_rentals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.rentals WHERE product_id = OLD.id
             AND status IN ('pending','confirmed','active','early_return_requested')) THEN
    RAISE EXCEPTION 'Anunțul are închirieri în desfășurare și nu poate fi șters definitiv. Îl poți dezactiva.';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_product_delete ON public.products;
CREATE TRIGGER trg_prevent_product_delete BEFORE DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.prevent_product_delete_with_active_rentals();

CREATE OR REPLACE FUNCTION public.get_owner_rentals(owner_uuid uuid)
 RETURNS TABLE(id uuid, public_id text, product_id uuid, renter_id uuid, start_date date, end_date date, rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric, owner_payout numeric, status text, payment_status text, payment_method text, created_at timestamp with time zone, product_title text, product_image text, renter_name text, renter_avatar text, handover_confirmed_at timestamp with time zone, return_confirmed_at timestamp with time zone, refunded_at timestamp with time zone, dispute_status text, pickup_agreed_at timestamp with time zone, rejection_reason text, message_to_owner text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT r.id, r.public_id, r.product_id, r.renter_id, r.start_date, r.end_date, r.rental_days,
    r.daily_price, r.subtotal, r.platform_fee, r.owner_payout, r.status,
    r.payment_status, r.payment_method, r.created_at,
    COALESCE(p.title, r.product_title_snapshot, 'Produs') as product_title,
    COALESCE(p.images[1], r.product_image_snapshot) as product_image,
    renter.full_name, renter.avatar_url,
    r.handover_confirmed_at, r.return_confirmed_at, r.refunded_at,
    COALESCE(r.dispute_status, 'none'), r.pickup_agreed_at, r.rejection_reason, r.message_to_owner
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  WHERE r.owner_id = owner_uuid
  ORDER BY r.created_at DESC;
$function$;