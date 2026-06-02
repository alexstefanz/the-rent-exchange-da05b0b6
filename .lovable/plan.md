## Problem

In `InspectionDialog`, when both parties have submitted their PV photos, the dialog shows a green "Confirm primirea" (checkout) / "Confirm returnarea" (checkin) button. This button calls `confirmHandover` / `confirmReturn` from `src/features/rentals/ownerRentalsApi.ts`, which does a direct `supabase.from("rentals").update(...)`.

The RLS on `public.rentals` only allows updates by:
- the owner (`owner_id = auth.uid()`)
- admins
- renter, but only to set `status='cancelled'` on a `pending` rental

When the renter (new test account) opens the PV and presses "Confirm primirea", the update matches zero rows. Supabase doesn't throw, so the UI shows a success toast but `handover_confirmed_at` is never set and the rental never moves to `active`. Same bug for the return side if the renter (or anyone other than the owner) is the one pressing the button.

## Fix

Move both transitions into SECURITY DEFINER RPCs that explicitly authorize **either** party and enforce the PV-completed precondition, then call them from the client.

### 1. DB migration — two RPCs

`public.confirm_rental_handover(_rental_id uuid)`:
- load the rental; require `auth.uid()` ∈ {owner_id, renter_id} else raise
- require `status IN ('confirmed','pending_handover')` and `handover_confirmed_at IS NULL`
- require both checkout PVs exist with `array_length(photos,1) >= 3` for roles `owner` and `renter` in `rental_inspections` (same gate the dialog already uses)
- update `handover_confirmed_at = now()`, `status = 'active'`, `updated_at = now()`
- return the updated row id
- `GRANT EXECUTE ... TO authenticated`

`public.confirm_rental_return(_rental_id uuid)`:
- same caller check (owner or renter)
- require `handover_confirmed_at IS NOT NULL` and `return_confirmed_at IS NULL` and `status='active'`
- require both checkin PVs (`role` in owner/renter, `phase='checkin'`, ≥3 photos)
- **does not** capture Stripe — capture stays in the existing `capture-rental-payment` edge function
- updates `return_confirmed_at`, `completed_at`, `status='completed'`

Both raise informative `RAISE EXCEPTION` messages that the existing `mapPvError` / toast can surface verbatim.

### 2. Client — `src/features/rentals/ownerRentalsApi.ts`

- `confirmHandover(rentalId)`: replace the direct table update with `supabase.rpc('confirm_rental_handover', { _rental_id: rentalId })`. Keep the best-effort `notify-rental-event` call for `handover_confirmed`.
- `confirmReturn(rentalId)`: keep the existing order — call `capture-rental-payment` first; on success, call `supabase.rpc('confirm_rental_return', { _rental_id: rentalId })` instead of the direct update. Keep the two follow-up notifications.

No UI changes required — `InspectionDialog` already invalidates `my-rentals` / `owner-rentals` after `handleConfirmGate`, so the renter will see the rental move forward immediately.

### 3. Out of scope

- No change to RLS policies on `rentals` (kept restrictive; the RPC is the controlled escape hatch).
- No change to PV flow, dispute flow, or `capture-rental-payment`.
- No change to admin/owner-only paths that still update `rentals` directly (cancellation, pickup, etc.).

### Verification

- New test renter account: complete checkout PV on both sides → "Confirm primirea" sets `handover_confirmed_at` and flips status to `active`; timeline advances.
- Owner pressing the same button still works.
- Pressing before both PVs are complete returns the RPC's error message via the existing toast.
