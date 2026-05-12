## Problem

In `MainActionCard`, after the owner accepts the request, `getTimelineStep` keeps the rental at step 2 (Confirmat) until `payment_status` becomes `authorized/paid`. For renters, the step-2 branch shows the generic "Așteaptă răspunsul proprietarului" message — even though the owner has already responded and the next action is on the renter (pay).

The chat "Deschide chat" button is also rendered for every step, including before payment.

## Changes

### 1. `src/components/dashboard/MainActionCard.tsx`

- In the `step === 2` renter branch, split by `rental.status`:
  - `rental.status === "pending"` (or anything not confirmed) → keep current "Așteaptă răspunsul proprietarului" copy.
  - `rental.status === "confirmed"` && `payment_status === "pending"` → swap to:
    - icon: `CreditCard`
    - title: "Proprietarul a acceptat cererea" / "The owner accepted your request"
    - desc: "Finalizează plata pentru a rezerva produsul. Suma este blocată pe card." / EN equivalent
    - primary CTA "Plătește" → calls a new `onPay` prop (passed from parent)
- Add `onPay?: () => void` to `Props`.
- Hide the "Deschide chat" button when payment is not yet authorized:
  - Compute `paymentMade = rental.payment_status === "authorized" || "paid" || "captured"`.
  - Render the chat button only when `paymentMade` is true (and not when cancelled/disputed branches override). Keep it visible in cancelled/disputed for support reasons? → Hide consistently for steps 1-2 where payment is not made; keep it from step 3 onward.

### 2. `src/components/dashboard/RentalsTab.tsx` (renter list)

- Pass `onPay={() => payForConfirmedRental(rental.id)…}` to `MainActionCard`, reusing the same handler currently inline above the timeline (lines 196-214). Keep the existing standalone "Plătește" button in the header OR remove it now that the action lives inside the action card — recommend removing the duplicate header button to avoid two CTAs.

### 3. `src/components/dashboard/RentalsOutTab.tsx` (owner list)

- No new CTA needed (owner already has Accept/Reject at step 2). Just inherit the new chat-visibility rule from `MainActionCard` automatically — owners also won't see chat until payment is made, matching the gated-contact policy.

## Out of scope

- No backend / RPC changes.
- No changes to `RentalDetailPage` (already has its own pay-now CTA).
- No changes to timeline step calculation.
