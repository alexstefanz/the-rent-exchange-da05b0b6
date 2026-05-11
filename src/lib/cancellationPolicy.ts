/**
 * Single source of truth for cancellation tier + refund computation.
 * Mirrored 1:1 in supabase/functions/_shared/cancellationPolicy.ts.
 */

export type CancellationTier =
  | "FREE"
  | "FIRST_DAY_FORFEIT"
  | "LIMITED"
  | "LOCKED"; // post-handover: cancellation no longer allowed

export interface CancellationOutcome {
  tier: CancellationTier;
  /** RON returned to renter */
  refundAmount: number;
  /** RON kept by owner as compensation */
  ownerCompensation: number;
  /** RON the platform retains (unrefundable fee) */
  platformRetention: number;
  /** Hours until rental start (negative if started) */
  hoursUntilStart: number;
}

export interface CancellationInput {
  startDate: string | Date;
  subtotal: number;
  dailyPrice: number;
  platformFee: number;
  handoverConfirmedAt?: string | null;
  /** Defaults to now() */
  now?: Date;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeCancellation(input: CancellationInput): CancellationOutcome {
  const now = input.now ?? new Date();
  const start =
    input.startDate instanceof Date
      ? input.startDate
      : new Date(`${input.startDate}T00:00:00`);
  const hoursUntilStart = (start.getTime() - now.getTime()) / 3_600_000;

  const subtotal = Number(input.subtotal) || 0;
  const daily = Number(input.dailyPrice) || 0;
  const fee = Number(input.platformFee) || 0;

  // Locked once handover PV is confirmed
  if (input.handoverConfirmedAt) {
    return {
      tier: "LOCKED",
      refundAmount: 0,
      ownerCompensation: 0,
      platformRetention: 0,
      hoursUntilStart,
    };
  }

  if (hoursUntilStart >= 48) {
    return {
      tier: "FREE",
      refundAmount: round2(subtotal + fee),
      ownerCompensation: 0,
      platformRetention: 0,
      hoursUntilStart,
    };
  }

  if (hoursUntilStart >= 24) {
    // First day forfeited
    const ownerComp = Math.min(daily, subtotal);
    const refund = round2(subtotal - ownerComp + fee);
    return {
      tier: "FIRST_DAY_FORFEIT",
      refundAmount: round2(refund),
      ownerCompensation: round2(ownerComp),
      platformRetention: 0,
      hoursUntilStart,
    };
  }

  // Under 24h or after start, before handover: first day + platform fee non-refundable
  const ownerComp = Math.min(daily, subtotal);
  const refund = Math.max(0, round2(subtotal - ownerComp));
  return {
    tier: "LIMITED",
    refundAmount: refund,
    ownerCompensation: round2(ownerComp),
    platformRetention: round2(fee),
    hoursUntilStart,
  };
}

export function freeCancellationDeadline(startDate: string | Date): Date {
  const start =
    startDate instanceof Date ? startDate : new Date(`${startDate}T00:00:00`);
  return new Date(start.getTime() - 48 * 3_600_000);
}

export function limitedCancellationDeadline(startDate: string | Date): Date {
  const start =
    startDate instanceof Date ? startDate : new Date(`${startDate}T00:00:00`);
  return new Date(start.getTime() - 24 * 3_600_000);
}