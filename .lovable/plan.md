

## Plan: Block confirmed rental dates in product calendar

### Approach

Fetch all confirmed/active rentals for the product and disable those date ranges in the calendar, so no other user can select overlapping dates.

### Changes

**1. Create a hook `src/hooks/queries/useBookedDates.ts`**
- Accepts `productId`
- Queries `rentals` table for rentals with `status` in (`confirmed`, `active`) matching the product
- Returns an array of `Date` objects covering all booked ranges (start_date through end_date inclusive)
- Uses `react-query` with appropriate caching

**2. Update `src/components/product/BookingCard.tsx`**
- Import and call `useBookedDates(productId)`
- Update the `disabled` prop on `<Calendar>` to also disable booked dates:
  ```ts
  disabled={(date) => isBefore(date, new Date()) || bookedDates.some(d => isSameDay(d, date))}
  ```
- Add visual styling for booked dates via `modifiers` (e.g. strikethrough or greyed out)

**3. Update `src/pages/ProductDetail.tsx`**
- Same changes as BookingCard — import `useBookedDates`, update the calendar's `disabled` prop to include booked dates
- Also update `handleDateSelect` to prevent selecting a range that spans across blocked dates

**4. Validate range selection**
- When user selects end date, check if any booked date falls between start and end — if so, reject and show toast

### Files affected
- `src/hooks/queries/useBookedDates.ts` (new)
- `src/components/product/BookingCard.tsx`
- `src/pages/ProductDetail.tsx`

### Notes
- Only rentals with status `confirmed` or `active` block dates (not `pending` — those are awaiting owner approval)
- RLS already allows anyone to see rentals where they are renter/owner, but we need public read for product availability. We'll query via a simple select filtered by product_id — the existing RLS policy `Users can view own rentals` won't work for other users viewing availability. **Solution**: Create a database function `get_booked_dates(product_id uuid)` with `SECURITY DEFINER` that returns start/end date pairs for confirmed/active rentals, avoiding RLS issues.

