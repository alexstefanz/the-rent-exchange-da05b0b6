import type { RentalStatusFilter } from "./RentalsFilterBar";

export interface BucketableRental {
  status: string;
  start_date: string;
  end_date: string;
  handover_confirmed_at?: string | null;
  return_confirmed_at?: string | null;
  return_pv_owner_signed_at?: string | null;
  return_pv_renter_signed_at?: string | null;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isReturned = (r: BucketableRental) =>
  !!r.return_confirmed_at ||
  (!!r.return_pv_owner_signed_at && !!r.return_pv_renter_signed_at);

/**
 * Assigns a rental to exactly one bucket. The 6 non-"all" buckets partition the
 * full rental set so counts always sum to total.
 */
export function bucketOf(r: BucketableRental): Exclude<RentalStatusFilter, "all"> {
  if (r.status === "cancelled" || r.status === "rejected") return "cancelled";
  if (r.status === "completed" || isReturned(r)) return "completed";
  if (r.status === "pending") return "pending";

  const active = r.status === "confirmed" || r.status === "active";
  if (active) {
    const today = startOfToday();
    const end = new Date(r.end_date);
    if (end < today) return "overdue";
    if (r.handover_confirmed_at) return "in_progress";
    return "active";
  }

  // Defensive fallback for unexpected statuses — surface to console so we can
  // extend the partition rather than silently dropping rows from counts.
  if (typeof console !== "undefined") {
    console.warn("[rentalBucket] uncategorized rental", { status: r.status });
  }
  return "active";
}

export function isOverdue(r: BucketableRental): boolean {
  return bucketOf(r) === "overdue";
}