## Problem

On the product page, the right-side booking card is `lg:sticky lg:top-24`, but its content (location + title + price + calendar + price breakdown + free-cancellation block) is taller than a typical laptop viewport (~853px). Because the sticky container has no height cap, the bottom of the card — including the "Trimite cererea" / "Send request" button — falls below the viewport. The user has to scroll the entire page down to the very bottom to reach it.

## Goal

The booking CTA must be visible without leaving the first scroll position. The sticky card should fit within the viewport on desktop and scroll internally when needed, while staying clean on mobile.

## Changes

Single file: `src/pages/ProductDetail.tsx` (the inline booking sidebar around line 283–395). `src/components/product/BookingCard.tsx` is not rendered on this page, but apply the same fix there for consistency since other entry points may reuse it.

### 1. Constrain the sticky card height on desktop

Change the sticky wrapper so it cannot grow taller than the viewport, and let internal content scroll:

- Wrapper: `lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`
- Add subtle scrollbar styling (`scrollbar-thin` utility already supported via tailwind config / use `[&::-webkit-scrollbar]:w-1.5` etc.) so it doesn't look broken.

### 2. Pin the CTA inside the card (preferred UX)

To guarantee the button is visible without forcing the user to scroll inside the card, restructure the card into two regions:

- Scrollable region: title, price summary, calendar, price breakdown.
- Pinned footer (inside the card): the action button + the dates pill.

Implementation:
- Wrap the card content in `flex flex-col` with the outer wrapper getting `lg:max-h-[calc(100vh-7rem)]`.
- Put the calendar/details block in a `flex-1 overflow-y-auto pr-1` div.
- Keep the `<Button>` (and the selected-dates pill, if any) in a `pt-4 border-t border-border bg-card sticky bottom-0` footer so it never scrolls out of sight.
- Move the "Anulare gratuită" info block above the footer (inside the scrollable area) — it's secondary info and shouldn't compete with the CTA for fixed space.

### 3. Trim vertical padding slightly on desktop

Reduce `p-6` to `lg:p-5` and `mb-4` separators to `mb-3` in the booking card on `lg+` so the card naturally takes less vertical space. This gives breathing room for shorter laptops (≤768px tall).

### 4. Mobile behavior

On mobile (`<lg`) the card is not sticky and renders above the description, so leave layout unchanged there — only the desktop branch (`lg:` utilities) gets the height cap and pinned footer.

### 5. Apply same pattern to `src/components/product/BookingCard.tsx`

Mirror the structure (max-height, internal scroll area, pinned CTA footer) so any other page that imports `BookingCard` benefits as well.

## Verification

After implementing:
1. Open `/produs/playstation-5` at 1366×768 and 1920×853.
2. Without scrolling, confirm the orange "Trimite cererea / Send request" button is visible inside the sticky card.
3. Select dates, confirm the price breakdown appears and the CTA stays visible (footer pinned).
4. Switch to mobile (375×812) and confirm card layout/order is unchanged and CTA reachable normally.
5. Toggle RO/EN to confirm both labels fit.
