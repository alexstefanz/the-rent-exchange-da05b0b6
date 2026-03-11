

## Plan: Redesign NearbyProductsSlider to match homepage cards

### Overview
Rewrite `NearbyProductsSlider` to use the same card style and draggable slider as the homepage `FeaturedListings` — `object-cover` images, overlay badges (favorite top-right, rating bottom-right), title + rating inline, location, price. Add drag support and fetch real ratings.

### Changes

**`src/components/products/NearbyProductsSlider.tsx`** — Full rewrite:

1. **Card layout**: Match homepage cards — `aspect-[4/3]` with `object-cover`, no padding/contain wrapper
2. **Favorite button**: Top-right with `Heart` icon in `#F98715` color, functional toggle (with auth check)
3. **Rating badge**: Bottom-right pill on image (`★ 4.9 (12)`) — fetch real ratings from `product_reviews` table
4. **Below image**: Title + star/rating inline, location with MapPin, price in primary color + "/ zi"
5. **Card width**: `w-[calc(50%-8px)]` mobile, `w-[220px]` desktop (5 cards visible, matching reference)
6. **Draggable slider**: Add mousedown/mousemove/mouseup handlers like homepage, `cursor-grab`/`cursor-grabbing`
7. **Scroll buttons**: Match homepage style (rounded border buttons, disabled state)
8. **Remove** the inner wrapper container (`bg-card p-6` border) — keep it cleaner like reference image

### Files affected
- `src/components/products/NearbyProductsSlider.tsx`

