## Goal
Declutter the notifications filter bar by replacing the category chip row with a single dropdown on all devices.

## Scope
Only `src/components/notifications/NotificationFilters.tsx`. No API, no logic changes.

## Changes

**Keep as chips (only 3 items):**
- Read state row: `Toate mesajele` / `Necitite` / `Citite` — stays unchanged.

**Convert to dropdown:**
- Category row (`Toate`, `Rezervări`, `Plăți`, `Suport`, `Sistem`, …) becomes a shadcn `Select`.
- Trigger shows the active category label + its count badge inline.
- Each `SelectItem` shows the category label with its count badge on the right.
- Width: compact (`w-[200px]` desktop, `w-full sm:w-[200px]` mobile) so it doesn't span the full row.
- Placed on the same line as (or just below) the read filter row depending on space — single row on desktop using `flex items-center justify-between`, stacked on mobile.

## Technical notes
- Use existing `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` from `@/components/ui/select`.
- Keep the same `FilterValue` type, `onChange` signature, and `counts` prop — purely presentational change.
- No change needed in `NotificationCenter.tsx` (consumer API unchanged).
