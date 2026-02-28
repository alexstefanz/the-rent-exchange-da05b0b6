

# Plan: Add explicit horizontal padding to card images

The inner container already has `p-4` but the images still appear too large. Replace the percentage-based constraints with fixed pixel padding on the inner container to guarantee visible spacing.

## Changes

### `src/components/products/ProductCard.tsx`
- **Gallery view (line 114):** Change inner container padding from `p-4` to `px-[15px] py-4`
- **List view (line ~67):** Same: `px-[15px] py-3`

### `src/components/products/NearbyProductsSlider.tsx`
- Change inner container padding from `p-3` to `px-[15px] py-3`

### `src/components/items/ItemCard.tsx`
- Change inner container padding from `p-4` to `px-[15px] py-4`

Additionally, the images themselves should not have max-width/max-height percentage limits that are too generous. Keep `max-h-[65%] max-w-[75%]` as-is since the added horizontal padding will visually reduce image width.

