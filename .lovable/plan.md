# Fix layout shift when opening dropdowns

## Problem
On `/cauta` and `/categorie/:slug`, clicking a Radix dropdown (Select / Popover — "All categories", "Price range", "Relevance", "Sortare") shifts the whole page slightly to the left while the dropdown is open, then snaps back on close.

## Root cause
Radix UI primitives (Select, Dialog, Popover when modal) lock body scroll on open. To prevent visible scrollbar reflow, Radix adds `padding-right` (equal to the scrollbar width, ~15px) to `<body>` while the menu is open. Because the page layout uses `mx-auto` containers, that extra right padding makes the centered content visually shift left.

Today `src/index.css` only sets `html, body { overflow-x: clip; }` — there is no reserved scrollbar gutter, so any scroll-lock compensation by Radix becomes a visible jump.

## Fix
Reserve the scrollbar gutter permanently so Radix's compensation becomes a no-op.

Edit `src/index.css`:

```css
html {
  scrollbar-gutter: stable;
}
html, body {
  overflow-x: clip;
}
```

`scrollbar-gutter: stable` keeps the vertical scrollbar space reserved at all times, so when Radix locks scroll and removes/compensates the scrollbar, layout width stays identical — no horizontal shift.

## Scope
- One-line CSS change in `src/index.css`.
- No component, no JS, no Radix config changes.
- Affects all pages globally (desired — same dropdown shift happens anywhere a Radix Select/Dialog opens).

## Verification
- Open `/cauta`, click "All categories", "Price range", "Relevance" — page must not shift.
- Open `/categorie/:slug` "Sortare" dropdown — same.
- Open any modal/dialog elsewhere (checkout, admin) — confirm no regression in spacing.

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
