## Problem

Several emails sent via `notify-rental-event` use `emailTemplate: { both: "..." }` (same template sent to renter AND owner) or incorrectly reuse a one-sided template for the wrong role. The body copy is written from one perspective only, so the other party reads phrasing that doesn't apply to them.

Concrete example reported (image): when the owner accepts a reservation, the OWNER also receives the renter-perspective email — "🎉 Cererea ta a fost acceptată! Alex Test (proprietarul) a confirmat rezervarea. Pregătește-te să te bucuri de produs." — which makes no sense for the owner.

## Audit results

| Template | Mapping today | Issue | Action |
|---|---|---|---|
| `rental-accepted` | `both` | Owner sees renter-only copy ("Cererea ta a fost acceptată", "Pregătește-te să te bucuri de produs", "Discută cu proprietarul") | **Split** into `rental-accepted-renter` (current copy) + new `rental-accepted-owner` |
| `request_cancelled_by_renter` → owner uses `rental-rejected` | wrong template | Owner reads "Din păcate, proprietarul nu a putut accepta cererea ta" — the owner is the recipient | Switch owner mapping to existing `cancellation-owner` ("Chiriașul a anulat cererea pentru produsul tău") |
| `request_cancelled_by_owner` → renter uses `rental-rejected` | partly OK but wording is "refuz" not "anulare" | Switch renter mapping to existing `cancellation-renter` ("Cererea ta de închiriere a fost anulată") |
| `pickup-scheduled` (both) | Neutral text ("Ai stabilit împreună cu cealaltă parte") | OK — no change |
| `handover-confirmed` (both) | Neutral ("ambele părți", "închirierea e activă") | OK — no change |
| `pv-pending`, `pv-other-done`, `return-reminder`, `return-deadline-2h`, `return-in-progress` (both) | Neutral phrasing | OK — no change |
| `review-reminder`, `dispute-opened` (both) | Neutral | OK — no change |
| `rental-completed-owner` / `rental-completed-renter` | Already split per role | OK |
| `rental-request-owner` / `rental-request-renter` | Already split | OK |
| `request-reminder-2h-*`, `request-expired-*` | Already split | OK |

## Changes

### 1. New template: `rental-accepted-owner.tsx`
- Subject: `Ai acceptat o cerere de închiriere ✓`
- H1: `Ai acceptat cererea`
- Lead: `Ai confirmat rezervarea pentru <renterName> la <productTitle>. Pregătește produsul pentru predare.`
- ProductCard with `status="approved"`, period, total price (suma încasată).
- Para: `Discută cu chiriașul direct din chat-ul Rentli pentru a stabili ridicarea.`
- CTA: `Vezi rezervarea`.
- Props: `productTitle, productImage, location, renterName, startDate, endDate, totalPrice, currency, rentalId`.

### 2. Rename current `rental-accepted.tsx` → `rental-accepted-renter.tsx`
- Keep current copy/props (already renter-targeted).
- Subject unchanged: `Cererea ta de închiriere a fost acceptată! 🎉`.

### 3. `registry.ts`
- Remove `'rental-accepted'`.
- Register `'rental-accepted-owner'` and `'rental-accepted-renter'`.

### 4. `notify-rental-event/index.ts`
- `request_accepted` (line ~77): `emailTemplate: { owner: "rental-accepted-owner", renter: "rental-accepted-renter" }`.
- Ensure `templateData` builder includes both `ownerName` (for renter email) and `renterName` (for owner email). Verify the data passed to the email per recipient role.
- `request_cancelled_by_renter` (line 244): change to `emailTemplate: { owner: "cancellation-owner" }`.
- `request_cancelled_by_owner` (line 259): change to `emailTemplate: { renter: "cancellation-renter" }`.

### 5. Deploy
Deploy `notify-rental-event` and `send-transactional-email` after edits.

## Out of scope

- Non-rental templates (welcome, KYC, withdrawals, tickets, product-published/rejected, account-banned, password-changed, new-message, review-received, payout-received) — single-recipient, copy is consistent with role.
- Visual/branding changes.
