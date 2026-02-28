

## Plan: Update BookingCard on Product Page

### Changes to `src/components/product/BookingCard.tsx`

1. **Remove trust indicators section** (lines 163-170): Delete the `<Separator>`, `<Shield>` free cancellation line, and `<TrustIndicators>` component at the bottom.

2. **Add date summary with styled input-like display** after dates are selected: A rounded bordered container showing "DD MMM YYYY > DD MMM YYYY" with a calendar icon (matching image 1 style).

3. **Add "Anulare gratuită" section** (matching image 2): A block with thumbs-up icon, bold "Anulare gratuită" title, description text about 48h free cancellation, and a link to `/politica-anulare`.

4. **Sticky behavior** is already implemented via `sticky top-24` on line 77 — this should work on desktop. Will verify the parent container allows sticky positioning (needs a scrollable parent without `overflow: hidden`).

### Implementation Details

- Remove `TrustIndicators` import and usage
- Remove `Shield` from lucide imports (keep others)
- Add `Link` from react-router-dom for the cancellation policy link
- Add `ThumbsUp` from lucide-react for the cancellation icon
- The date summary bar appears when both dates are selected, styled as a rounded pill with border
- The cancellation section replaces the old trust indicators section

