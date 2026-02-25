

## Transform Product Sections into Airbnb-style Sliders

### What changes

Each product section on the homepage (Popular, Categories, Recent, Best Reviews) will become a horizontal slider with:
- Navigation arrows (left/right) to scroll through products in groups of 4-5
- The **last visible card** replaced with a "Vezi toate" (See All) card that links to `/cauta`, styled like the Airbnb screenshot (rotated image thumbnails + "See all" text)
- Smooth scrolling between pages of products

### How it works

Currently each section shows 5 products in a static grid. The new behavior:
- Products are loaded in larger batches (e.g. up to 10-15 per section)
- Desktop: show 5 cards at a time (4 products + 1 "See All" card), with prev/next arrows positioned top-right like Airbnb
- Mobile: horizontal scroll with snap, 2 cards visible
- Arrows appear/disappear based on scroll position
- The "See All" card shows 2-3 stacked/rotated thumbnail images from the remaining products + "Vezi toate" text

### Technical details

**File: `src/components/home/FeaturedListings.tsx`** (major rewrite of `ProductRow`)

1. Replace the static `grid` layout with a scrollable flex container (CSS-based, no Embla needed for simplicity)
2. Add `useState` for scroll position tracking via `ref`
3. Add left/right arrow buttons positioned top-right of the section header (like Airbnb)
4. Increase product slices from 5 to ~10 to have content to scroll through
5. Append a "See All" card as the last item in each row

**New component inside the file: `SeeAllCard`**
- Rounded card matching product card dimensions
- Contains 2 small product thumbnail images rotated at slight angles (-6deg, 6deg)
- "Vezi toate" text below
- Links to `/cauta`

**Scroll logic:**
- Use a `useRef` on the scroll container
- `scrollBy` with smooth behavior, scrolling by the width of ~4 cards
- Track `scrollLeft` to disable prev arrow at start, next arrow at end
- Hide arrows on mobile (touch scroll with snap instead)

### Files to modify
- `src/components/home/FeaturedListings.tsx` — transform ProductRow into slider with arrows + See All card

