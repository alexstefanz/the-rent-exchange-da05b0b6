export interface PriceBreakdown {
  months: number;
  weeks: number;
  days: number;
  /** Owner-net subtotal: dailyPriceOwner × rentalDays. */
  subtotal: number;
  /** Platform fee charged on top of subtotal (min 1 RON when feePercent > 0). */
  platformFee: number;
  /** What the client pays: subtotal + platformFee. */
  total: number;
}

/** Minimum platform fee in RON when a fee percent applies. */
export const MIN_PLATFORM_FEE_RON = 1;

/**
 * Compute the platform fee for a given owner-net subtotal.
 * - Returns 0 when feePercent is 0 (free listings).
 * - Otherwise enforces a floor of {@link MIN_PLATFORM_FEE_RON} RON.
 */
export function calcPlatformFee(subtotalOwner: number, feePercent: number): number {
  if (!feePercent || feePercent <= 0 || subtotalOwner <= 0) return 0;
  const raw = Math.round(subtotalOwner * feePercent) / 100; // 2-decimal precision
  const rounded = Math.round(raw * 100) / 100;
  return Math.max(MIN_PLATFORM_FEE_RON, rounded);
}

/** Total the client pays = owner subtotal + platform fee (min 1 RON when applicable). */
export function calcClientTotal(subtotalOwner: number, feePercent: number): number {
  return Math.round((subtotalOwner + calcPlatformFee(subtotalOwner, feePercent)) * 100) / 100;
}

/**
 * Single source of truth for the rental price calculation, used
 * both on the product page and at checkout.
 *
 * `dailyPriceOwner` is the integer net price the owner receives per day.
 * `priceWeek` / `priceMonth` are reserved for future tiered pricing.
 */
export function computeRentalPrice(
  rentalDays: number,
  dailyPriceOwner: number,
  priceWeek: number,
  priceMonth: number,
  feePercent: number = 0,
): PriceBreakdown {
  if (!rentalDays || rentalDays <= 0) {
    return { months: 0, weeks: 0, days: 0, subtotal: 0, platformFee: 0, total: 0 };
  }
  const subtotal = Math.round(rentalDays * dailyPriceOwner * 100) / 100;
  const platformFee = calcPlatformFee(subtotal, feePercent);
  const total = Math.round((subtotal + platformFee) * 100) / 100;
  return { months: 0, weeks: 0, days: rentalDays, subtotal, platformFee, total };
}