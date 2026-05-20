# Live-update the available balance container

## Problem
The wallet/balance widget in the header (`AccountHubMenu`) reads `signals.availableBalance` from `useAccountDashboard`. That value is computed from `public.transactions` rows of type `owner_payout` (plus minus `withdrawal`). When a rental completes and a new `owner_payout` transaction is inserted, the widget keeps showing the old amount until the user manually refreshes — because:

1. The realtime channel in `useAccountDashboard.ts` subscribes to `rentals`, `messages`, `notifications`, `profiles` — but **not** to `transactions` or `withdrawals`.
2. The `transactions` table is **not** part of the `supabase_realtime` publication, so even if we subscribed, no events would fire.

## Changes

### 1. Migration — add tables to realtime publication
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
```
(Wrap each in a guard so a re-run doesn't fail if already present.)

### 2. `src/hooks/useAccountDashboard.ts`
In the realtime `useEffect`, add two more `.on("postgres_changes", …)` subscriptions on the same channel:
- `{ event: "*", schema: "public", table: "transactions", filter: \`user_id=eq.${userId}\` }` → `invalidate`
- `{ event: "*", schema: "public", table: "withdrawals", filter: \`user_id=eq.${userId}\` }` → `invalidate`

This makes the balance refetch the moment an `owner_payout` row is inserted (rental completion) or a `withdrawal` row is created/updated.

### 3. Belt-and-suspenders refetch on focus
Add `refetchOnWindowFocus: true` to the `useQuery` so returning to the tab also refreshes the balance even if a realtime event was missed.

## Out of scope
- The arithmetic itself (`owner_payout - withdrawal`) is already correct — confirmed it matches the 4 RON the user has.
- `useWalletBalance` (RPC-based, used on `/castiguri`) — already invalidates correctly there; no change needed.
- No UI changes to the balance container.

## Verification
1. After deploy, complete a rental as owner → within ~1s the header balance updates from old value to new value without a page refresh.
2. Initiate a withdrawal → balance decrements in the header immediately.
3. Switch tabs and back → balance re-syncs even if the realtime event was missed.
