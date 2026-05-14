## Plan

Remove the "În așteptare" (pending) state entirely from the wallet. All owner payouts go straight into "Disponibil" the moment the rental record exists with an owner_payout, with no holding state.

### Changes

**1. `src/hooks/useEarnings.ts`**
- Drop the `pendingPayout` accumulator and the `pendingPayout` field from `EarningsData` (and its initial value).
- `availableBalance` becomes `totalAllTime - totalWithdrawn - pendingWithdrawals` (no pending subtracted).
- Per-row tx `status` mapping: keep `cancelled` as cancelled, everything else → `available` (drop the `held` case).

**2. `src/components/earnings/BalanceBreakdown.tsx`**
- Remove the `pending` prop and the second card.
- Grid becomes 3 columns: Disponibil / Retras / Total câștiguri (`grid-cols-3` on `sm:`, `grid-cols-1` or `grid-cols-3` on mobile).

**3. `src/components/profile/EarningsTab.tsx`**
- Drop `pending={earnings.pendingPayout}` from the `<BalanceBreakdown>` call.

**4. `src/components/earnings/statusBadge.tsx` & `PayoutTimeline.tsx`**
- Leave the `pending`/`held` enum values in place (not breaking), but they will simply no longer be emitted by `useEarnings`. No UI will surface them. (No edits needed unless they're rendered elsewhere — quick check confirms they're driven only by `useEarnings`.)

### Out of scope
- Backend / Stripe capture flow stays unchanged (escrow still happens server-side); only the wallet UI's pending categorization is removed.
- Withdrawal flow unchanged.
