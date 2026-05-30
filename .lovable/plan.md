## Problem
"Plătește din wallet" fails silently. Postgres logs show:
`Renters can only cancel their pending rentals; financial / state columns are read-only`.

The `lock_renter_rental_update` trigger blocks any renter-driven UPDATE to financial columns (`wallet_credit_applied`, `payment_status`, `payment_method`, `paid_at`, ...). The `pay_rental_with_wallet` RPC updates exactly those columns but does NOT set the trusted-bypass flag that other RPCs (e.g. `confirm_handover_received`) use.

## Fix
One new migration that recreates `public.pay_rental_with_wallet(uuid)` identically to the current version, with a single added line before the `UPDATE rentals ...`:

```sql
PERFORM set_config('app.bypass_renter_lock', 'on', true);
```

Then re-grant:
```sql
GRANT EXECUTE ON FUNCTION public.pay_rental_with_wallet(uuid) TO authenticated;
```

Scope: transaction-local (`set_config(..., true)`), same pattern already used by `confirm_handover_received`. No other RPC, trigger, or frontend change is needed.

## Out of scope
- No changes to `RentalDetailPage.tsx`, `rentalsApi.ts`, `useWalletBalance`, or the wallet UI.
- No changes to the anti-tampering trigger itself.

## Verification
1. Open an accepted (status `confirmed`, unpaid) rental as the renter with wallet balance ≥ subtotal.
2. Click "Plătește din wallet" → expect success toast, rental flips to `payment_status='paid'` / `payment_method='wallet'`, and a `wallet_ledger` row `rental_credit_capture` with negative amount is created.
3. Re-check Postgres logs — the "financial / state columns are read-only" error must not reappear for this flow.
