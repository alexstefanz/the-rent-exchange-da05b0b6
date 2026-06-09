## Problem

On the product page, the booking card shows only `days × dailyPrice = Total`, with no separate "Comision Rentli" line. The user only sees the commission later at checkout (second screenshot — `Sumar financiar` already displays it correctly).

Root cause in `src/components/product/PremiumBookingCard.tsx` (and `MobileStickyBookingBar.tsx`):
- `computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth)` is called **without** the 5th argument `feePercent`, so `platformFee` is hardcoded to `0`.
- The `clientPrice` prop name is misleading: per `calculateClientPrice` in `src/features/products/productsApi.ts`, the displayed daily price is the owner-net price, not the gross client price. The fee is added on top at checkout (min 1 RON).

## Fix — product page price transparency

### 1. `src/components/product/PremiumBookingCard.tsx`
- Add a new prop `platformFeePercent: number` (default 0).
- Pass it as the 5th arg to `computeRentalPrice(...)` so `breakdown.platformFee` and `breakdown.total` reflect the real commission.
- In the breakdown block (shown after both dates picked), add a new row between the subtotal and the Total:
  - Label: `Comision Rentli` / `Rentli fee` with a small "info" tooltip explaining the 5% fee, min 1 RON.
  - Value: `formatPriceShort(breakdown.platformFee) RON`.
- Render the row only when `breakdown.platformFee > 0` (free listings stay clean).
- `Total` already binds to `breakdown.total`, so it will now include the fee.

### 2. `src/components/product/MobileStickyBookingBar.tsx`
- Forward `platformFeePercent` from props.
- Use it in the `useMemo` total: `computeRentalPrice(rentalDays, clientPrice, priceWeek, priceMonth, platformFeePercent).total`.
- This ensures the sticky bar's headline total matches the card.

### 3. `src/pages/ProductDetail.tsx`
- Pass `platformFeePercent={product.platform_fee_percent ?? 0}` to:
  - the desktop `<PremiumBookingCard ... />` (line ~425)
  - the `<MobileStickyBookingBar ... />` (lines ~293 and ~467)
- Update the inline `totalPrice` calc used by the `Reserve` handler (line ~241) to pass `product.platform_fee_percent` to `computeRentalPrice` so the value handed to `/checkout` already includes the fee. Checkout's `Sumar financiar` will keep showing the same breakdown.

### 4. Optional micro-copy under the daily price
Below the `XX RON / zi` line in the booking card hero, add a one-liner muted note:
`+ 5% comision Rentli (min 1 RON) la finalizare` / `+ 5% Rentli fee (min 1 RON) at checkout`.
Shown only when `platformFeePercent > 0`.

## Out of scope
- No DB or RPC changes — `platform_fee_percent` is already on `products` and used by checkout.
- No changes to ListingCard / ProductCard grid tiles (those intentionally show the headline daily price; the request is about the product page + rental flow).
- No changes to the checkout summary (already shows `Comision Rentli`).

## Files to change
- `src/components/product/PremiumBookingCard.tsx`
- `src/components/product/MobileStickyBookingBar.tsx`
- `src/pages/ProductDetail.tsx`

## Verification
- Open a product with `platform_fee_percent = 5` for 2 days at 2 RON/zi: booking card shows `2 RON × 2 zile = 4 RON`, `Comision Rentli = 1 RON`, `Total = 5 RON`. Mobile sticky bar total reads `5 RON`.
- Free product (`platform_fee_percent = 0`): no `Comision Rentli` row, Total equals subtotal.
- Clicking `Rezervă` lands on checkout with the same 5 RON breakdown already shown on the product page.
