# Hide contact-alert after payment, fix contact visibility, add call button for both roles

## Context

- `InfoPanel` decides `isPaid` from `paid_at || payment_status === "paid"`. But after a successful Stripe authorization the rental is typically `payment_status = 'authorized'` with `paid_at` still null until capture. So contact stays hidden even though the platform RPC `get_contact_info_if_in_conversation` would return it (it already accepts `authorized | paid | captured | partially_refunded`). The screenshot ("Plată efectuată" / "Așteaptă predarea produsului") matches this state.
- `ChatPanel` uses the same too-narrow check for `showPhone`, and only fetches the **owner's** phone (renter side). The owner never sees a call button for the renter.
- `MessageInput` always shows the "Date de contact detectate" alert, even after payment when sharing a phone/email is normal.

## Changes

### 1. Shared "is paid" helper

Export a tiny helper from `src/features/messaging/messagingApi.ts` so all three components agree:

```ts
export function isRentalPaidLike(
  paymentStatus?: string | null,
  paidAt?: string | null
): boolean {
  if (paidAt) return true;
  return ["authorized", "paid", "captured", "partially_refunded"].includes(
    (paymentStatus || "").toLowerCase()
  );
}
```

### 2. `src/components/messaging/InfoPanel.tsx`

- Replace the `isPaid` computation to use `isRentalPaidLike(data.payment_status, data.paid_at)`.
- Keep the rest of the contact-gating logic as is — `getOwnerContactInfo` already works bidirectionally for renter↔owner via the existing RPC, so once `isPaid` is true the peer's phone/email will render for both sides.

### 3. `src/components/messaging/ChatPanel.tsx`

- Compute `const isPaid = isRentalPaidLike(rentalCtx?.payment_status, rentalCtx?.paid_at);` once.
- Use `isPaid` for both the existing collapsed/expanded rental-context block and the new `showPhone` prop.
- Remove the `if (!ownerId || isOwner) return;` guard around the phone fetch. Always fetch `peerId`'s contact via `getOwnerContactInfo(peerId)` so the owner sees the renter's phone too. Store as `peerPhone`.
- Pass `peerPhone` to `ChatHeader` as `phone`, and pass `isPaid` as `showPhone`.
- Pass `isPaid` down to `<MessageInput isPaid={isPaid} ... />` so the input can skip the contact-info alert after payment.

### 4. `src/components/messaging/ChatHeader.tsx`

- Render the phone button **and** the "Vezi produs" button side by side when both are available (today it's `phone ? ... : productUrl ? ...`). Change to two independent conditional blocks so they can coexist.
- Keep the same styling (ghost icon for phone, primary pill for "Vezi produs"). Tooltip stays "Apelează / Call".
- Visibility rule stays: phone button only renders when `showPhone && phone`.

### 5. `src/components/messaging/MessageInput.tsx`

- Accept optional `isPaid?: boolean` prop.
- In `handleSend`, wrap the phone/email detection in `if (!isPaid) { ... }` so the warning dialog is suppressed once payment is made and sharing contact details is expected.
- No other behavior changes (profanity and special-char checks stay).

## Out of scope

- No DB / RPC / migration changes — the existing `get_contact_info_if_in_conversation` RPC already supports both directions and authorized payments.
- No styling refactor beyond placing the new call icon next to "Vezi produs".
