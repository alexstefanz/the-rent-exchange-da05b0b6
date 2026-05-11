
-- 1. Rentals: pickup + dispute + reminder columns
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS pickup_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_proposal jsonb,
  ADD COLUMN IF NOT EXISTS pickup_location text,
  ADD COLUMN IF NOT EXISTS pickup_time timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dispute_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_phase text,
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS dispute_opened_by uuid,
  ADD COLUMN IF NOT EXISTS pickup_reminder_sent_at timestamptz;

-- 2. Inspections: lock + declaration
ALTER TABLE public.rental_inspections
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS declaration_accepted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_rentals_pickup_reminder_pending
  ON public.rentals (pickup_agreed_at)
  WHERE pickup_agreed_at IS NOT NULL
    AND pickup_reminder_sent_at IS NULL
    AND handover_confirmed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rental_inspections_rental_phase_role
  ON public.rental_inspections (rental_id, phase, role);

-- 3. Trigger: enforce PV gates on rentals updates
CREATE OR REPLACE FUNCTION public.enforce_pv_gates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_co int;
  renter_co int;
  owner_ci int;
  renter_ci int;
BEGIN
  -- Block any state changes while a dispute is open (admin bypass).
  IF OLD.dispute_status = 'open'
     AND NEW.dispute_status = 'open'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.handover_confirmed_at IS DISTINCT FROM OLD.handover_confirmed_at
          OR NEW.return_confirmed_at IS DISTINCT FROM OLD.return_confirmed_at)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'DISPUTE_OPEN' USING ERRCODE = 'P0001';
  END IF;

  -- Gate handover_confirmed_at: requires both checkout inspections with >=3 photos.
  IF NEW.handover_confirmed_at IS NOT NULL
     AND OLD.handover_confirmed_at IS NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN

    IF NEW.pickup_agreed_at IS NULL THEN
      RAISE EXCEPTION 'PICKUP_NOT_AGREED' USING ERRCODE = 'P0001';
    END IF;

    SELECT COUNT(*) INTO owner_co
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkout' AND role = 'owner'
       AND array_length(photos, 1) >= 3;
    SELECT COUNT(*) INTO renter_co
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkout' AND role = 'renter'
       AND array_length(photos, 1) >= 3;

    IF owner_co = 0 OR renter_co = 0 THEN
      RAISE EXCEPTION 'PV_INCOMPLETE_HANDOVER' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Gate return_confirmed_at: requires both checkin inspections with >=3 photos.
  IF NEW.return_confirmed_at IS NOT NULL
     AND OLD.return_confirmed_at IS NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN

    SELECT COUNT(*) INTO owner_ci
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkin' AND role = 'owner'
       AND array_length(photos, 1) >= 3;
    SELECT COUNT(*) INTO renter_ci
      FROM rental_inspections
     WHERE rental_id = NEW.id AND phase = 'checkin' AND role = 'renter'
       AND array_length(photos, 1) >= 3;

    IF owner_ci = 0 OR renter_ci = 0 THEN
      RAISE EXCEPTION 'PV_INCOMPLETE_RETURN' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pv_gates ON public.rentals;
CREATE TRIGGER trg_enforce_pv_gates
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pv_gates();

-- 4. Trigger: auto-lock inspections once both parties for a phase exist.
CREATE OR REPLACE FUNCTION public.auto_lock_inspections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_count int;
  renter_count int;
BEGIN
  SELECT COUNT(*) INTO owner_count
    FROM rental_inspections
   WHERE rental_id = NEW.rental_id AND phase = NEW.phase AND role = 'owner';
  SELECT COUNT(*) INTO renter_count
    FROM rental_inspections
   WHERE rental_id = NEW.rental_id AND phase = NEW.phase AND role = 'renter';

  IF owner_count > 0 AND renter_count > 0 THEN
    UPDATE rental_inspections
       SET locked_at = COALESCE(locked_at, now())
     WHERE rental_id = NEW.rental_id AND phase = NEW.phase;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_lock_inspections ON public.rental_inspections;
CREATE TRIGGER trg_auto_lock_inspections
  AFTER INSERT ON public.rental_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_lock_inspections();

-- 5. Refresh get_owner_rentals to expose dispute_status + pickup_agreed_at.
DROP FUNCTION IF EXISTS public.get_owner_rentals(uuid);

CREATE OR REPLACE FUNCTION public.get_owner_rentals(owner_uuid uuid)
RETURNS TABLE(
  id uuid, product_id uuid, renter_id uuid, start_date date, end_date date,
  rental_days integer, daily_price numeric, subtotal numeric, platform_fee numeric,
  owner_payout numeric, status text, payment_status text, payment_method text,
  created_at timestamptz, product_title text, product_image text,
  renter_name text, renter_avatar text,
  handover_confirmed_at timestamptz, return_confirmed_at timestamptz,
  refunded_at timestamptz, dispute_status text, pickup_agreed_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.product_id, r.renter_id, r.start_date, r.end_date, r.rental_days,
    r.daily_price, r.subtotal, r.platform_fee, r.owner_payout, r.status,
    r.payment_status, r.payment_method, r.created_at,
    COALESCE(p.title, 'Produs') as product_title,
    p.images[1] as product_image,
    renter.full_name as renter_name,
    renter.avatar_url as renter_avatar,
    r.handover_confirmed_at,
    r.return_confirmed_at,
    r.refunded_at,
    COALESCE(r.dispute_status, 'none') as dispute_status,
    r.pickup_agreed_at
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  WHERE r.owner_id = owner_uuid
  ORDER BY r.created_at DESC;
$function$;
