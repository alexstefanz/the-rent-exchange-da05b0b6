## Change

On the homepage (`src/pages/Index.tsx`), the categories grid currently uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` which renders 12 categories on 3 rows of 4 on desktop.

Update it to display **6 categories per row × 2 rows** on desktop:

- Change the grid classes to: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Mobile (2 cols) and tablet (3 cols) stay readable; desktop (≥1024px) shows 6 per row.
- Reduce card padding slightly (`p-6` → `p-4`) so the narrower cards don't feel cramped at 6-up.

No other pages affected (the `/categorii` Categories page keeps its 4-column layout).
