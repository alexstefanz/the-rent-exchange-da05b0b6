-- 1. Add public_id column to rentals
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS public_id text NOT NULL DEFAULT 'RNT-000000';

-- 2. Sequence
CREATE SEQUENCE IF NOT EXISTS public.rental_public_id_seq START WITH 1 INCREMENT BY 1;

-- 3. Backfill existing rentals deterministically by created_at order
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.rentals
)
UPDATE public.rentals r
SET public_id = 'RNT-' || lpad(o.rn::text, 6, '0')
FROM ordered o
WHERE r.id = o.id;

-- Advance sequence past the highest backfilled value
SELECT setval(
  'public.rental_public_id_seq',
  GREATEST(
    (SELECT COALESCE(MAX(NULLIF(regexp_replace(public_id, '\D', '', 'g'), '')::bigint), 0) FROM public.rentals),
    1
  ),
  true
);

-- 4. Unique index on public_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_rentals_public_id ON public.rentals(public_id);

-- 5. Trigger function to auto-generate on insert
CREATE OR REPLACE FUNCTION public.generate_rental_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_val bigint;
BEGIN
  IF NEW.public_id IS NULL OR NEW.public_id = 'RNT-000000' OR NEW.public_id = '' THEN
    next_val := nextval('public.rental_public_id_seq');
    NEW.public_id := 'RNT-' || lpad(next_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rental_public_id ON public.rentals;
CREATE TRIGGER trg_rental_public_id
  BEFORE INSERT ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_rental_public_id();

-- 6. Update get_admin_rentals RPC to include public_id
DROP FUNCTION IF EXISTS public.get_admin_rentals(text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_rentals(
  status_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  public_id text,
  product_id uuid,
  product_title text,
  renter_id uuid,
  renter_name text,
  owner_id uuid,
  owner_name text,
  start_date date,
  end_date date,
  rental_days integer,
  daily_price numeric,
  subtotal numeric,
  platform_fee numeric,
  owner_payout numeric,
  status text,
  payment_status text,
  created_at timestamp with time zone,
  category text,
  location_city text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    COALESCE(p.location_city, '-') AS location_city
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles renter ON renter.id = r.renter_id
  LEFT JOIN public.profiles owner ON owner.id = r.owner_id
  WHERE (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- 7. Helper RPC for chatbot/support: lookup by public_id (admin or participant)
CREATE OR REPLACE FUNCTION public.get_rental_by_public_id(p_public_id text)
RETURNS TABLE(
  id uuid,
  public_id text,
  product_id uuid,
  product_title text,
  renter_id uuid,
  renter_name text,
  owner_id uuid,
  owner_name text,
  start_date date,
  end_date date,
  rental_days integer,
  status text,
  payment_status text,
  subtotal numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    r.status,
    r.payment_status,
    r.subtotal,
    r.created_at
  FROM public.rentals r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles renter ON renter.id = r.renter_id
  LEFT JOIN public.profiles owner ON owner.id = r.owner_id
  WHERE r.public_id = p_public_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR r.renter_id = auth.uid()
      OR r.owner_id = auth.uid()
    );
END;
$$;