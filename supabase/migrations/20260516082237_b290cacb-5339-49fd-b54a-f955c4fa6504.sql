CREATE POLICY "Renters can create own rentals"
ON public.rentals
FOR INSERT
TO authenticated
WITH CHECK (renter_id = auth.uid());