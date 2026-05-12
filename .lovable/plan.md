# Fix payment error + remove auto chat message

## Problem 1 — "Plătește acum" 500 error
Stripe RON has a **minimum charge of 2 RON**. The PS5 rental subtotal is 1 RON, so `checkout.sessions.create` fails with:
> The Checkout Session's total amount due must add up to at least Lei2.00 ron

## Problem 2 — Unwanted auto message
After the renter submits a rental request, `submitRentalRequest` (in `src/features/rentals/rentalsApi.ts`, lines 93–119) auto-inserts a "Bună! Am trimis o cerere..." message in the rental conversation. The user wants chat messages to be triggered only at the post-payment checkout flow, not at request creation.

---

## Plan

### 1. `supabase/functions/create-checkout-session/index.ts`
- Before calling `stripe.checkout.sessions.create`, validate `rental.subtotal >= 2` (RON minimum for Stripe).
- If below, return `400` with a clear error key `MIN_AMOUNT` and message in RO/EN so the frontend can show a friendly toast instead of a generic 500.

### 2. `src/components/dashboard/RentalsTab.tsx` (renter pay handler)
- When `payForConfirmedRental` rejects with `MIN_AMOUNT`, show a toast: "Suma totală este sub minimul acceptat de procesatorul de plată (2 RON)." Otherwise keep current redirect behavior.

### 3. `src/features/products/` product publishing validation (Zod schema for daily price)
- Enforce `price_per_day >= 2` (RON) at product create/edit, with a localized error message, so future listings cannot be created below the Stripe minimum. (No DB migration — purely client validation, matching existing approach.)

### 4. `src/features/rentals/rentalsApi.ts` — remove auto message
- Delete the auto-message branch (lines 101–118 of the current file). Keep the custom `messageToOwner` insert: only post a message when the renter explicitly typed one in the booking form. If `customMsg` is empty, insert nothing.
- Conversation thread is still created so the owner can open chat after payment.

## Out of scope
- No changes to the `notify-rental-event` flow, payment webhook, RLS, or DB schema.
- Existing PS5 test rental at 1 RON will remain unpayable until the owner re-lists at ≥ 2 RON; this is intended (the platform minimum).
