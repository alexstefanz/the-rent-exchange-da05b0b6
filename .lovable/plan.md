

## Plan: Remove Scrollbar from Booking Sidebar

Remove `lg:overflow-y-auto` and `lg:max-h-[calc(100vh-7rem)]` from the booking card container in `ProductDetail.tsx` (line 259). This eliminates the visible scrollbar while keeping the sticky positioning.

### File: `src/pages/ProductDetail.tsx` (line 259)
- Remove: `lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]`
- Keep: `lg:sticky lg:top-24 rounded-xl border border-border bg-card p-4 sm:p-6`

