## Problem

In "Cereri primite" (`/inchirieri` → `RentalsOutTab`) the rental **RNT-000077** (Televizor OLED EVO LG 48C52LA, pending) does not appear, even though the data is correctly returned by the database.

## Investigation so far

- DB row exists: `rentals.public_id = 'RNT-000077'`, `status = 'pending'`, `payment_status = 'pending'`, owner = `74835c82…` (same as logged-in owner)
- `get_owner_rentals(owner_uuid)` RPC **does** return RNT-000077 (confirmed via direct query)
- Total = 17 → matches the "Toate (17)" chip in the UI
- Other pending rental (RNT-000074, also pending+payment_pending) renders fine, so it's not a status/payment filter

## Likely cause

The premium card grid uses CSS `columns-2 xl:columns-3 [column-fill:_balance]` (`RentalsOutTab.tsx` line 171). With 5 cards of unequal heights (the pending card is taller because of 2 action buttons + the cancel link area), CSS columns reflow can:

- push RNT-000077 into a second column row that visually falls below the fold, and
- in some browsers / heights, the balancing of `column-fill: balance` can clip or "swallow" a `break-inside-avoid` item when its computed height exceeds the column's available space, making it appear missing.

It's also fragile because the rendering order `[...pendingRentals, ...premiumActiveRentals]` doesn't visually group pending requests together when CSS columns reflow.

## Fix

Replace the brittle CSS columns layout with a normal responsive CSS grid that places pending requests first and on their own row, so every card is guaranteed to render in a predictable position.

`src/components/dashboard/RentalsOutTab.tsx`:

1. Change the wrapper around the cards (line 171) from:
   ```
   <div className="columns-2 xl:columns-3 gap-3 sm:gap-4 [column-fill:_balance]">
   ```
   to:
   ```
   <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
   ```
2. Remove `break-inside-avoid` and `mb-3 sm:mb-4` from the card root (no longer needed inside a grid).
3. Optionally render pending requests in their own grid block (with a small "Necesită acțiune" subtitle) followed by a second grid for `premiumActiveRentals`, so new requests are always visually grouped at the top regardless of column reflow.

No backend, RLS, or data changes are needed — the RPC already returns RNT-000077 correctly.

## Verification

- Reload `/inchirieri` as the owner and confirm RNT-000077 appears among the 5 "Cereri de închiriere" cards with the "Cerere nouă" badge.
- Confirm Acceptă / Refuză work on it.
- Confirm the other 4 cards still render and the layout looks correct on mobile, tablet and desktop.