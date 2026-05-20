In `src/components/dashboard/LeaveReviewDialog.tsx`, within the "Rate this transaction" card:

- Change the header row from a flex row (title/subtitle left, stars right) to a left-aligned vertical stack:
  1. Title "Rate this transaction"
  2. Subtitle "{product} · {counterparty}"
  3. `StarPicker` directly below, left-aligned

- Remove the right-side wrapper/justify-between so the stars no longer float to the right.