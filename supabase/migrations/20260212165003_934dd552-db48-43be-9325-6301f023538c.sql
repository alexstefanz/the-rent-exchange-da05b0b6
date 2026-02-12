-- Allow owners to update status on their own rentals (accept/reject)
CREATE POLICY "Owners can update own rental requests"
ON public.rentals
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());