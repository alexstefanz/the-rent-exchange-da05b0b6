## Problem

In `src/components/product/BookingCard.tsx`, the `totalPrice` calculation for rental periods of 30+ days uses `Math.ceil(rentalDays / 30) * priceMonth`, which rounds up partial months to a full month price — but then ignores the actual extra days entirely.

This causes the visible bug:
- **1 May → 31 May** = 31 days → `ceil(31/30) = 2` → `2 × priceMonth`
- **1 May → 1 June** = 32 days → `ceil(32/30) = 2` → `2 × priceMonth` (same!)
- **1 May → 30 June** = 61 days → `ceil(61/30) = 3` → `3 × priceMonth`

So any range from 30 to 60 days returns the same total. The screenshot the user attached confirms this: 32 days × 1.05 RON = 46 RON, but the breakdown line is contradictory (shows daily multiplication while the formula actually used months).

There is also a second inconsistency: the breakdown UI always displays `rentalDays × clientPrice`, which doesn't match the tiered calculation (week/month) actually used for `totalPrice`.

## Fix

Update the `totalPrice` `useMemo` in `BookingCard.tsx` to properly decompose the rental into full months + remaining weeks + remaining days, using the cheapest tier for each chunk:

```text
months   = floor(rentalDays / 30)
remainder = rentalDays % 30
weeks    = floor(remainder / 7)
extraDays = remainder % 7
total = months*priceMonth + weeks*priceWeek + extraDays*clientPrice
```

Examples after fix (with priceMonth, priceWeek, clientPrice from the product):
- 31 days → 1 month + 1 day
- 32 days → 1 month + 2 days
- 37 days → 1 month + 1 week
- 60 days → 2 months
- 61 days → 2 months + 1 day

## Breakdown UI fix

Update the price breakdown block (the muted box that currently shows `{rentalDays} {days} × {clientPrice} RON`) to reflect the tiered breakdown, e.g.:
- `1 lună × 30 RON`
- `1 săpt × 10 RON`
- `2 zile × 2 RON`
- `Total: 42 RON`

Only show the lines that are non-zero. This keeps the visible math consistent with the computed total.

## Files to change

- `src/components/product/BookingCard.tsx` — fix `totalPrice` formula and the breakdown rendering.

## Out of scope

- No backend, schema, or pricing-data changes. Product prices (`clientPrice`, `priceWeek`, `priceMonth`) remain as stored.
- Checkout server-side recomputation (if any) is not touched in this plan; if the backend recomputes totals, we'll verify it matches after the client fix.
