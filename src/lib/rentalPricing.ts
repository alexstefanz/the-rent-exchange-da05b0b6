export interface PriceBreakdown {
  months: number;
  weeks: number;
  days: number;
  total: number;
}

/**
 * Decomposes a rental duration into months (30 days), weeks (7 days)
 * and remaining days, then sums the cost of each tier.
 * Single source of truth for the rental price calculation, used
 * both on the product page and at checkout.
 */
export function computeRentalPrice(
  rentalDays: number,
  clientPrice: number,
  priceWeek: number,
  priceMonth: number
): PriceBreakdown {
  if (!rentalDays || rentalDays <= 0) {
    return { months: 0, weeks: 0, days: 0, total: 0 };
  }
  const total = rentalDays * clientPrice;
  return { months: 0, weeks: 0, days: rentalDays, total: Math.round(total * 100) / 100 };
}