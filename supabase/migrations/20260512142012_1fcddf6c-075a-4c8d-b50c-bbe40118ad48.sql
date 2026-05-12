UPDATE public.rentals
SET payment_status = 'captured',
    captured_at = COALESCE(captured_at, now()),
    paid_at = COALESCE(paid_at, now())
WHERE public_id = 'RNT-000061'
  AND status = 'completed'
  AND payment_status = 'authorized'
  AND is_test_payment = true;