
-- Create user_activity_logs table
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can read activity logs"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert (for manual entries)
CREATE POLICY "Admins can insert activity logs"
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- System/triggers can insert via security definer functions
-- Create trigger function for products
CREATE OR REPLACE FUNCTION public.log_product_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.owner_id, 'PRODUCT_CREATED', 'product', NEW.id::text,
      jsonb_build_object('title', NEW.title, 'category', NEW.category, 'price', NEW.daily_price_owner));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Price change
    IF OLD.daily_price_owner IS DISTINCT FROM NEW.daily_price_owner THEN
      INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (NEW.owner_id, 'PRICE_CHANGED', 'product', NEW.id::text,
        jsonb_build_object('title', NEW.title, 'old_price', OLD.daily_price_owner, 'new_price', NEW.daily_price_owner));
    END IF;
    -- Deactivated (deleted)
    IF OLD.is_active = true AND NEW.is_active = false THEN
      INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (NEW.owner_id, 'PRODUCT_DEACTIVATED', 'product', NEW.id::text,
        jsonb_build_object('title', NEW.title));
    END IF;
    -- Reactivated
    IF OLD.is_active = false AND NEW.is_active = true THEN
      INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (NEW.owner_id, 'PRODUCT_REACTIVATED', 'product', NEW.id::text,
        jsonb_build_object('title', NEW.title));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (OLD.owner_id, 'PRODUCT_DELETED', 'product', OLD.id::text,
      jsonb_build_object('title', OLD.title));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_product_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_product_activity();

-- Create trigger function for profiles (phone, kyc_status changes)
CREATE OR REPLACE FUNCTION public.log_profile_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'PHONE_UPDATED', 'profile', NEW.id::text,
      jsonb_build_object('old_phone', OLD.phone, 'new_phone', NEW.phone));
  END IF;
  IF OLD.kyc_status IS DISTINCT FROM NEW.kyc_status THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'KYC_STATUS_CHANGED', 'profile', NEW.id::text,
      jsonb_build_object('old_status', OLD.kyc_status, 'new_status', NEW.kyc_status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_activity
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_activity();

-- Create trigger for kyc_cases status changes
CREATE OR REPLACE FUNCTION public.log_kyc_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.user_id, 'KYC_CASE_CREATED', 'kyc_case', NEW.id::text,
      jsonb_build_object('public_id', NEW.public_id, 'level', NEW.level_required, 'role', NEW.user_role));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.user_id, 'KYC_' || NEW.status, 'kyc_case', NEW.id::text,
      jsonb_build_object('public_id', NEW.public_id, 'old_status', OLD.status, 'new_status', NEW.status));
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kyc_activity
  AFTER INSERT OR UPDATE ON public.kyc_cases
  FOR EACH ROW EXECUTE FUNCTION public.log_kyc_activity();

-- Create trigger for rentals
CREATE OR REPLACE FUNCTION public.log_rental_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.renter_id, 'RENTAL_CREATED', 'rental', NEW.id::text,
      jsonb_build_object('product_id', NEW.product_id, 'start_date', NEW.start_date, 'end_date', NEW.end_date, 'subtotal', NEW.subtotal));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (COALESCE(NEW.renter_id, NEW.owner_id), 'RENTAL_' || UPPER(NEW.status), 'rental', NEW.id::text,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rental_activity
  AFTER INSERT OR UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.log_rental_activity();
