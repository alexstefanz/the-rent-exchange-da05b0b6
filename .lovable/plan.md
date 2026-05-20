# Restrict early return initiation to the renter

## Problem
Currently both the owner and the renter can initiate an early return request. The owner should not be able to act as if they were the customer — only the renter (the one holding the product) can request to return it earlier. The owner remains able to approve/reject a request initiated by the renter.

## Changes

### 1. `src/components/rentals/EarlyReturnCard.tsx` (frontend)
- In the default "prompt" state (no active request), render the chat + "Solicită returnare anticipată" CTA **only when `role === "renter"`**.
- For `role === "owner"` with no pending request: render nothing (return `null`) so the owner no longer sees an initiation card. The owner will still see the pending/accepted states normally (handled by the earlier branches that render for both roles).
- Remove the now-unused owner-side `promptTitle` / `promptHint` owner variants and the "Discută cu Chiriașul" button (renter-only copy stays).

### 2. `supabase/functions/request-early-return/index.ts` (backend safeguard)
- After loading the rental and identifying the user, reject the request when the caller is the owner: return `403 { error: "owner_cannot_initiate" }`.
- Keep the existing renter-only path (auto-approves renter, awaits owner approval via `respond-early-return`).
- Remove the now-dead `isOwner` branch that sets `early_return_owner_approved_at` on initiation.

### 3. `supabase/functions/notify-rental-event/index.ts` (cleanup)
- For event `early_return_proposed`, the `initiatorRole` is always `"renter"` now; no behavioral change required, but ensure SMS/email/in-app copy used for the owner is the "renter wants to return early" wording (verify and keep as-is if already correct).

## Out of scope
- Backend `respond-early-return` (still used by owner to approve/reject) — unchanged.
- DB schema — unchanged. The `early_return_owner_approved_at` column stays; it is only set when the owner explicitly approves.
- Cancellation flow, dispute flow — untouched.

## Verification
1. As an owner viewing a rental in "Produs predat" state → the early-return card no longer appears.
2. As a renter in the same state → the card appears and they can submit a request.
3. After renter submits → owner sees the pending card with Approve / Reject buttons.
4. Direct call to `request-early-return` edge function with an owner's JWT returns 403.
