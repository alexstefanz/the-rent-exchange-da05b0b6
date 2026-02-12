CREATE POLICY "Renters can cancel own pending rentals"
ON public.rentals FOR UPDATE
USING (renter_id = auth.uid() AND status = 'pending')
WITH CHECK (renter_id = auth.uid() AND status = 'cancelled');