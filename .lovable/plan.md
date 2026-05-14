## Goal
Exclude test-mode (Stripe test card) payments from the wallet so only real card revenue counts toward balances.

## Findings
- `rentals.is_test_payment` already flags Stripe test-mode rentals (set by `create-test-checkout-session`).
- Currently `useEarnings.ts` and the `get_user_wallet_balance` RPC sum `owner_payout` for every rental in `payment_status IN ('authorized','paid','captured')` regardless of the test flag.
- Example: user `74835c82…` has 12 RON earnings, of which 2 RON come from a single `is_test_payment = true` rental that should not appear in the wallet.

## Changes

1. **DB migration** — recreate `get_user_wallet_balance(_user_id uuid)` so the earnings sum adds `AND is_test_payment = false`. No signature change.

2. **`src/hooks/useEarnings.ts`**
   - Add `is_test_payment` to the `rentals` select.
   - Filter the in-memory `list` with `r.is_test_payment === false` before computing `totalAllTime`, `totalThisMonth`, `availableBalance`, transactions list, and rental count.

No UI changes; the breakdown card and hero card automatically reflect the corrected numbers. Withdrawals logic stays untouched.

## Out of scope
- Admin earnings/analytics dashboards (they may intentionally show test totals).
- Hiding the test rentals from rental lists / history.