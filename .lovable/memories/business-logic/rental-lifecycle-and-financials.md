---
name: Rental Lifecycle and Financials
description: Escrow model, rental statuses, platform fee 15% (from first transaction, no free listings), daily payout calculation
type: feature
---
- Platform fee is **15%** of the owner-net rental value, paid by the owner.
- **First 3 listings per user are free** (`platform_fee_percent = 0`). From the 4th listing onward the standard 15% fee applies.
- Owner payout equals the owner-net subtotal (`daily_price_owner × rental_days`).
- The renter/client total charged by Stripe = subtotal + platform fee (minimum 1 RON fee when percent > 0).
- Financial calculations are centralized in `src/lib/rentalPricing.ts` (`calcPlatformFee`, `calcClientTotal`, `computeRentalPrice`).
- Rental financial fields (`subtotal`, `platform_fee`, `platform_fee_percent`, `owner_payout`) are enforced automatically by the `tg_rentals_enforce_price` trigger.
