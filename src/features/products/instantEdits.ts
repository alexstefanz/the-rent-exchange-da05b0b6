/** Owner may change these on a live listing without admin review (no free text/images). */
export const INSTANT_EDIT_FIELDS = [
  "daily_price_owner",
  "min_rental_days",
  "min_rental_preset",
  "max_rental_days",
  "pickup_available",
  "delivery_available",
  "delivery_radius_km",
  "available_immediately",
  "available_from",
  "blocked_dates",
] as const;

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Split an edit into instantly-applied fields and changed fields needing moderation. */
export const partitionEdits = (
  edits: Record<string, unknown>,
  current: Record<string, unknown>,
) => {
  const instant: Record<string, unknown> = {};
  const moderated: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(edits)) {
    if ((INSTANT_EDIT_FIELDS as readonly string[]).includes(k)) instant[k] = v;
    else if (!sameValue(v, current[k])) moderated[k] = v;
  }
  return { instant, moderated };
};

