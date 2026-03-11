

## Plan: Redesign product cards in FeaturedListings to match reference image

### Overview
Redesign the product cards in the homepage slider to match the reference: full-cover image, overlaid badges (check top-left, favorite top-right, rating bottom-right), category label, title, location, and price below. Make slider draggable. Show 3 cards per row on desktop.

### Changes

**1. `src/components/home/FeaturedListings.tsx`** -- Main changes

**Image container:**
- Change from `object-contain` with padding to `object-cover` filling the entire container
- Remove the inner wrapper divs, use img directly with `object-cover`

**Overlay badges on image:**
- Top-left: CheckCircle badge (keep as-is)
- Top-right: Heart/favorite button (keep as-is)  
- Bottom-right: Rating badge with star icon + score + review count in a pill (e.g. `★ 4.9 (47)`)

**Below image section:**
- Orange label with white text showing the product category
- Product title (bold, dark)
- Location with MapPin icon (city + pickup_address if available)
- Price in orange + "/ zi"

**Card width:** Change from `w-[calc(20%-16px)]` (5 per row) to `w-[calc(33.333%-11px)]` (3 per row on desktop), keep `w-[calc(50%-8px)]` on mobile

**Draggable slider:**
- Add mouse drag support: track `mousedown`, `mousemove`, `mouseup` on the scroll container
- Add `cursor-grab` / `cursor-grabbing` classes
- Touch already works via native scroll

**Rating data:** Already fetched -- also fetch review counts alongside averages

**2. `src/components/products/ProductCard.tsx`** -- Apply same visual changes for consistency on search/category pages (cover image, category label, rating badge)

### Files affected
- `src/components/home/FeaturedListings.tsx`
- `src/components/products/ProductCard.tsx`

