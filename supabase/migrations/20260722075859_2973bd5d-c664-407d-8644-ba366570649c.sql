
-- KYC: restrict user updates so status cannot be moved to APPROVED/REJECTED by the user
DROP POLICY IF EXISTS "Users can update own kyc cases" ON public.kyc_cases;
CREATE POLICY "Users can update own kyc cases"
ON public.kyc_cases
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = ANY (ARRAY['NOT_STARTED','IN_PROGRESS','REJECTED','SUBMITTED'])
)
WITH CHECK (
  user_id = auth.uid()
  AND status = ANY (ARRAY['NOT_STARTED','IN_PROGRESS','SUBMITTED'])
  AND decided_by_admin_id IS NULL
  AND decided_at IS NULL
  AND risk_score = 0
  AND level_required = ANY (ARRAY['LEVEL_1','LEVEL_2','LEVEL_3'])
);

-- Rentals: restrict owner direct updates - forbid direct manipulation of dispute/payment states
DROP POLICY IF EXISTS "Owners can update own rental requests" ON public.rentals;
CREATE POLICY "Owners can update own rental requests"
ON public.rentals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  AND dispute_status = 'none'
  AND early_return_status = ANY (ARRAY['none','requested','accepted','rejected'])
  AND status = ANY (ARRAY['pending','confirmed','accepted','active','completed','cancelled','rejected'])
  AND payment_status = ANY (ARRAY['pending','authorized','captured','refunded','failed'])
);
