## Changes in `src/pages/RentalDetailPage.tsx` (header block, ~lines 280–301)

**1. Move the role badge ("Tu esti chirias" / "Tu esti proprietar") next to the RNT ID on mobile**
- Currently the badge sits in the right-side column, below the status pill — so on mobile it falls under the title.
- Render it inline next to `rental.public_id` (the `RNT-000114` line) so they share the same row at the top of the header.
- Make it more prominent on mobile: switch from the outline `Badge` to a solid primary chip (`bg-primary/10 text-primary border-primary/20`, `font-semibold`, slightly larger text), so it visually pops next to the muted mono ID.
- Keep the desktop layout intact — the chip simply sits next to the ID on every breakpoint, which also reads well on desktop.

**2. Remove the tiny empty shape above the role badge**
- That shape is `<StatusBadge status={rental.status} />` rendering an empty label when `rental.status === "confirmed"` (the `StatusBadge` map has no entry for `confirmed`, so it shows just the pill background with no text — visible in image 2).
- Remove the `StatusBadge` from the header entirely. Rental status is already communicated by the timeline + action cards below, so no replacement is needed.
- The right-side flex column that only contained the status pill and the role badge can be removed since the role badge now lives next to the ID.

## Result
- Mobile: `← Inapoi la lista` → image + (`RNT-000114`  `Tu esti chirias` chip) + title + date row. No mystery empty pill.
- Desktop: same arrangement, role chip sits inline with the ID instead of being pushed to the right column.

No other files change.