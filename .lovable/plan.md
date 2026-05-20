Update review display on product page to match the simplified single-rating + comment model.

**1. `src/components/product/ReviewSummaryCard.tsx`**
- Remove the 3-criteria progress bars (`Comunicare`, `Stare produs`, `Punctualitate`) and the `Bar` helper.
- Keep big average rating + count, centered/left layout. Simplify grid to a single column.

**2. `src/components/product/ProductReviewsSection.tsx`** — replace `ReviewCard` body:
- Drop the 3 rows of criteria stars (condition / communication / punctuality).
- Show one row: `<StarRating value={review.rating} />` next to the user name area (right side of header).
- Below the header, render `review.comment` (if present) as a paragraph (`text-sm text-foreground whitespace-pre-wrap`).
- Localize the date with `language` (ro→`ro`, en→default).

No API or DB changes. Legacy reviews keep working: `review.rating` is the overall value already stored for both old multi-criteria and new single-rating entries.