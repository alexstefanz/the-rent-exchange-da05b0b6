export interface PriceBreakdown {
  months: number;
  weeks: number;
  days: number;
  /** Owner-net subtotal: dailyPriceOwner × rentalDays. */
  subtotal: number;
  /** Rentli commission (15%, min 1 RON when feePercent > 0). */
  platformFee: number;
  /** Card processing fee (Stripe EEA: 1.4% + 1 RON) on subtotal + platformFee. */
  stripeFee: number;
  /** Insurance cost — not implemented yet, always 0. */
  insuranceFee: number;
  /** What the client pays by card: subtotal + platformFee + stripeFee + insuranceFee. */
  total: number;
}

/** Minimum platform fee in RON when a fee percent applies. */
export const MIN_PLATFORM_FEE_RON = 1;
/** Stripe EEA consumer card pricing. */
export const STRIPE_FEE_PERCENT = 1.4;
export const STRIPE_FEE_FIXED_RON = 1;
/** Insurance not implemented yet. */
export const INSURANCE_FEE_RON = 0;

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcPlatformFee(subtotalOwner: number, feePercent: number): number {
  if (!feePercent || feePercent <= 0 || subtotalOwner <= 0) return 0;
  return Math.max(MIN_PLATFORM_FEE_RON, r2((subtotalOwner * feePercent) / 100));
}

/** Stripe card processing fee: 1.4% + 1 RON on the amount before the fee. */
export function calcStripeFee(baseAmount: number): number {
  if (!baseAmount || baseAmount <= 0) return 0;
  return r2((baseAmount * STRIPE_FEE_PERCENT) / 100 + STRIPE_FEE_FIXED_RON);
}

export function calcInsuranceFee(_subtotalOwner: number): number {
  return INSURANCE_FEE_RON;
}

/** Full card total for an owner-net subtotal. */
export function calcFullBreakdown(subtotalOwner: number, feePercent: number) {
  const subtotal = r2(subtotalOwner);
  const platformFee = calcPlatformFee(subtotal, feePercent);
  const insuranceFee = calcInsuranceFee(subtotal);
  const stripeFee = calcStripeFee(subtotal + platformFee + insuranceFee);
  const total = r2(subtotal + platformFee + insuranceFee + stripeFee);
  return { subtotal, platformFee, insuranceFee, stripeFee, total };
}

/** Total the client pays by card. */
export function calcClientTotal(subtotalOwner: number, feePercent: number): number {
  return calcFullBreakdown(subtotalOwner, feePercent).total;
}

export function computeRentalPrice(
  rentalDays: number,
  dailyPriceOwner: number,
  _priceWeek: number,
  _priceMonth: number,
  feePercent: number = 0,
): PriceBreakdown {
  if (!rentalDays || rentalDays <= 0) {
    return { months: 0, weeks: 0, days: 0, subtotal: 0, platformFee: 0, stripeFee: 0, insuranceFee: 0, total: 0 };
  }
  const b = calcFullBreakdown(rentalDays * dailyPriceOwner, feePercent);
  return { months: 0, weeks: 0, days: rentalDays, ...b };
}
