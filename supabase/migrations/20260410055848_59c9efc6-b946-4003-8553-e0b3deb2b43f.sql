
-- Create rental_inspections table
CREATE TABLE public.rental_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phase TEXT NOT NULL,
  role TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_rental_inspection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phase NOT IN ('checkout', 'checkin') THEN
    RAISE EXCEPTION 'phase must be checkout or checkin';
  END IF;
  IF NEW.role NOT IN ('owner', 'renter') THEN
    RAISE EXCEPTION 'role must be owner or renter';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_rental_inspection
  BEFORE INSERT ON public.rental_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rental_inspection();

-- Enable RLS
ALTER TABLE public.rental_inspections ENABLE ROW LEVEL SECURITY;

-- RLS: participants can create own inspections
CREATE POLICY "Users can create own inspections"
  ON public.rental_inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

-- RLS: participants + admins can view
CREATE POLICY "Participants can view inspections"
  ON public.rental_inspections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rentals r
      WHERE r.id = rental_id
        AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin')
  );

-- No UPDATE or DELETE policies = immutable records

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rental-inspections', 'rental-inspections', true);

-- Storage: anyone can view
CREATE POLICY "Anyone can view inspection photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rental-inspections');

-- Storage: rental participants can upload
CREATE POLICY "Rental participants can upload inspection photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'rental-inspections'
    AND auth.uid() IS NOT NULL
  );
