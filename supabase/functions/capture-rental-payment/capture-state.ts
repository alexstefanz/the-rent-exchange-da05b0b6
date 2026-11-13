/** A captured payment is an idempotent success, not another capture attempt. */
export function getCaptureState(
  rental: { payment_status?: unknown; end_date?: unknown },
  today: string,
  allowBeforeEndDate = false,
): "already_captured" | "capture" | "not_authorized" | "before_end_date" {
  if (rental.payment_status === "captured") return "already_captured";
  if (rental.payment_status !== "authorized") return "not_authorized";
  if (!allowBeforeEndDate && typeof rental.end_date === "string" && rental.end_date > today) {
    return "before_end_date";
  }
  return "capture";
}