DROP POLICY IF EXISTS "Renters can create own rentals" ON public.rentals;
CREATE POLICY "Renters can create own rentals"
ON public.rentals
FOR INSERT
TO authenticated
WITH CHECK (
  renter_id = auth.uid()
  AND status = 'pending'
  AND COALESCE(payment_status, 'pending') = 'pending'
  AND paid_at IS NULL
  AND authorized_at IS NULL
  AND captured_at IS NULL
  AND refunded_at IS NULL
  AND payment_intent_id IS NULL
  AND COALESCE(wallet_credit_applied, 0) = 0
  AND is_test_payment = false
  AND end_date >= start_date
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = rentals.product_id
      AND p.owner_id = rentals.owner_id
      AND p.owner_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update own rental requests" ON public.rentals;
CREATE POLICY "Owners can update own rental requests"
ON public.rentals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  AND dispute_status = 'none'
  AND status = ANY (ARRAY['pending','confirmed','accepted','cancelled','rejected'])
  AND (
    status <> 'confirmed'
    OR payment_status = ANY (ARRAY['pending','authorized','paid','captured'])
  )
);