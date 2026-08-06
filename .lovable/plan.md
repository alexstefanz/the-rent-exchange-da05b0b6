# Two listings per row on mobile (map mode)

## Problem
In map mode the default list (when no listing is selected) still shows one card per row on phones. Only the "similar listings" grid inside the selected-listing panel was switched to two columns earlier, so the screen in the screenshot is unaffected.

## Change
- Make the main map list grid two columns from the smallest breakpoint, keeping two on tablet and three on very wide screens.
- Tighten card spacing so two cards fit comfortably at 390px width (smaller horizontal gap on mobile, unchanged on larger screens).
- Adjust `MapProductCard` typography/padding slightly at mobile size (title, city line, price) so text does not wrap awkwardly in a half-width card.

## Technical details
- `src/components/category/map/CategoryMapView.tsx` line 226: `grid-cols-1 ... sm:grid-cols-2 xl:grid-cols-3` becomes `grid-cols-2 gap-x-3 sm:gap-x-5 xl:grid-cols-3`.
- `src/components/category/map/MapProductCard.tsx`: reduce base font sizes / line clamps for the compact width, scaling back up at `sm:`.
- No changes to data fetching, pagination (19 per page), or map behaviour.
