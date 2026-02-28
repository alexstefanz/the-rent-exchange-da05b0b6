

# Plan: Inner rounded container for product card images

Wrap the product image in an inner container with `rounded-[30px]` and `bg-white` inside the card's image area. The outer area becomes the card background (`bg-[#F7F6F2]`), and the image sits fully contained inside the rounded inner box.

## Changes

### `src/components/products/ProductCard.tsx`
**Gallery view (line 111-120):**
- Change outer div bg from `bg-white` to `bg-[#F7F6F2]` (or `bg-background`)
- Inside, wrap `<img>` in a new div: `<div className="w-full h-full rounded-[30px] bg-white flex items-center justify-center overflow-hidden p-4">`
- Image uses `max-h-[80%] max-w-[90%] object-contain`
- Badges (CheckCircle, Heart) stay absolutely positioned on the outer div

**List view (lines 65-78):**
- Same pattern: outer bg neutral, inner rounded container for image

### `src/components/products/NearbyProductsSlider.tsx`
- Same inner rounded container pattern for NearbyProductCard image

### `src/components/items/ItemCard.tsx`
- Same inner rounded container pattern

