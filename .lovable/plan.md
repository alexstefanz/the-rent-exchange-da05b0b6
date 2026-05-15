## Problem

In `RentalsTab.tsx` and `RentalsOutTab.tsx` the premium card uses `mt-auto pt-3 sm:pt-4` on the action area, which pushes the "Vezi detalii" button to the bottom of the card. Because cards in the same CSS grid row stretch to the tallest card's height, cards without a "Mesajul tău" / "Mesaj de la chiriaș" block end up with a large empty gap between Total and the button.

## Fix

### 1. Remove forced bottom-push on the action area

In both files, the wrapper around the "Vezi detalii" button currently is:

```tsx
<div className="mt-auto pt-3 sm:pt-4">
```

Change to a fixed top spacing so the button sits right below the message (when present) or right below the Total tile (when absent):

```tsx
<div className="mt-3 sm:mt-4">
```

Also remove `flex-1` from the inner content column so cards size to their content rather than stretching:

- Line ~234 in `RentalsTab.tsx` and equivalent in `RentalsOutTab.tsx`:
  `className="flex flex-1 flex-col p-3 sm:p-4"` → `className="flex flex-col p-3 sm:p-4"`

### 2. Masonry layout so uneven heights don't leave gaps

Replace the CSS grid with a CSS columns masonry on the premium cards section in both files.

Current:
```tsx
<div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
  {[...pendingRentals, ...premiumActiveRentals].map(...)}
</div>
```

New:
```tsx
<div className="columns-2 xl:columns-3 gap-3 sm:gap-4 [column-fill:_balance]">
  {[...pendingRentals, ...premiumActiveRentals].map(rental => (
    <div key={rental.id} className="mb-3 sm:mb-4 break-inside-avoid">
      {/* existing card markup */}
    </div>
  ))}
</div>
```

Notes:
- `columns-2` keeps 2 columns on mobile (matches current request).
- `break-inside-avoid` + `mb-*` ensures each card stays intact and spacing stays uniform.
- Cards will now flow vertically per column, removing the row-stretch gaps.

### Files changed
- `src/components/dashboard/RentalsTab.tsx`
- `src/components/dashboard/RentalsOutTab.tsx`

No business logic, data, or desktop layout changes beyond the column count parity (`md:grid-cols-2 xl:grid-cols-3` → `xl:columns-3`).