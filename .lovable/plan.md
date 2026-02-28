

# Plan: Add padding to product card images

Add internal padding to the image container in ProductCard so images sit inset from the card edges, creating a cleaner, more consistent look regardless of aspect ratio.

## Changes

### `src/components/products/ProductCard.tsx`
- **Gallery view** (line 111): Add `p-4` padding to the image container div (`relative aspect-[4/3] overflow-hidden bg-white` → `relative aspect-[4/3] overflow-hidden bg-white p-4`)
- **List view** (line 65): Add `p-3` padding to the list image container similarly
- Both keep `object-contain` + `bg-white` so images scale within the padded area

### `src/components/products/NearbyProductsSlider.tsx`
- Add `p-3` padding to the NearbyProductCard image container for consistency

### `src/components/items/ItemCard.tsx`
- Add `p-4` padding to image container for consistency across all card types

