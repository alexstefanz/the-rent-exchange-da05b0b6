
-- Add new rental columns for cancellation/early return tracking
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS early_return_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS early_return_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_return_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_return_reason text,
  ADD COLUMN IF NOT EXISTS early_return_owner_response text,
  ADD COLUMN IF NOT EXISTS early_return_refund_amount numeric,
  ADD COLUMN IF NOT EXISTS cancellation_tier text,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS owner_compensation numeric;

-- Status history: immutable audit log
CREATE TABLE IF NOT EXISTS public.rental_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  actor_role text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rental_status_history_rental
  ON public.rental_status_history (rental_id, created_at DESC);

ALTER TABLE public.rental_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants & admins view status history" ON public.rental_status_history;
CREATE POLICY "Participants & admins view status history"
  ON public.rental_status_history
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_status_history.rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

-- No INSERT/UPDATE/DELETE policies → only service role can write (immutable)

-- Trigger that logs every status change automatically
CREATE OR REPLACE FUNCTION public.log_rental_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rental_status_history (rental_id, from_status, to_status, actor_id, actor_role, reason)
    VALUES (NEW.id, NULL, NEW.status, NEW.renter_id, 'system', 'created');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.rental_status_history (
      rental_id, from_status, to_status, actor_id, actor_role, reason, metadata
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE
        WHEN auth.uid() = NEW.renter_id THEN 'renter'
        WHEN auth.uid() = NEW.owner_id THEN 'owner'
        WHEN auth.uid() IS NULL THEN 'system'
        ELSE 'admin'
      END,
      NEW.cancellation_reason,
      jsonb_build_object(
        'cancellation_tier', NEW.cancellation_tier,
        'refund_amount', NEW.refund_amount,
        'owner_compensation', NEW.owner_compensation,
        'early_return_status', NEW.early_return_status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rentals_status_history ON public.rentals;
CREATE TRIGGER trg_rentals_status_history
  AFTER INSERT OR UPDATE OF status ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_rental_status_change();
