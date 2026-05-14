## Diagnosis

Currently in `src/hooks/useEarnings.ts`, the wallet shows funds as "În așteptare" while `payment_status === 'authorized'` (Stripe hold). However, several rentals exist where the rental is already finalized (`status === 'completed'`) but the payment_status is still `authorized` (Stripe capture didn't update the row, e.g. test payments or capture race). Those funds are stuck in "În așteptare" forever even though the rental is done.

Example from the database:
- rental `70bf38…` — status `completed`, payment_status `authorized`, owner_payout 2.99 RON → currently sits in "În așteptare"
- rental `46a65c…` — status `completed`, payment_status `authorized`, owner_payout 2.00 RON → same issue (this is the 2 RON visible in your screenshot)

## Fix

Move funds from "În așteptare" → "Disponibil" the moment a rental reaches `status = 'completed'`, regardless of `payment_status`. Pending should only count rentals that are still active/confirmed and haven't been finalized.

Edit in `src/hooks/useEarnings.ts`:

```text
- if (r.payment_status === "authorized") pendingPayout += payout;
+ if (r.status !== "completed" && r.status !== "cancelled"
+     && r.payment_status === "authorized") {
+   pendingPayout += payout;
+ }
```

And mirror in the per-row `status` mapping so completed always shows "available":

```text
let status: TxStatus = "pending";
if (r.status === "cancelled") status = "cancelled";
else if (r.status === "completed") status = "available";   // already first
else if (r.payment_status === "captured" || r.payment_status === "paid") status = "available";
else if (r.payment_status === "authorized") status = "held";
```
(no change needed here — already correct.)

## Result

- The 2 RON from the completed rental is instantly added to "Disponibil".
- Any future rental marked as completed (return confirmed by both parties) immediately frees the owner payout into the available balance.
- Active/confirmed rentals (still on Stripe hold) continue to show as "În așteptare", as expected.

## Out of scope

- No backend / Stripe changes — capture flow stays the same. The fix is purely how the wallet UI categorizes already-finalized rentals.
- No automatic bank transfer — withdrawals remain manual via the existing "Retrage bani" flow.
