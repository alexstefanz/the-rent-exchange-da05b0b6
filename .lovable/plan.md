

## Plan: Slide Animation for Product Image Gallery

### What changes

Replace the current static image display (both mobile and desktop) with an Embla Carousel that has smooth slide transitions and is draggable on touch devices.

### Implementation

#### 1. Create `src/components/product/ProductImageGallery.tsx`

A new reusable component wrapping Embla Carousel (already installed in the project) with:
- Smooth horizontal slide animation between images
- **Draggable on mobile/tablet** (Embla's default touch behavior) -- disabled drag on desktop (`lg:` breakpoint) where arrow buttons are used instead
- Dot indicators showing current slide position
- Prev/Next arrow buttons on desktop
- Favorite button overlay
- Back/Share buttons on mobile
- Click to open lightbox
- Syncs `currentImageIndex` state with the carousel API

#### 2. Update `src/pages/ProductDetail.tsx`

Replace both the mobile image gallery (lines 199-213) and the desktop gallery (lines 227-241) with the single `ProductImageGallery` component, passing the required props (images, callbacks, isFavorite, etc.).

### Technical details

- Uses `embla-carousel-react` already in the project (from `carousel.tsx`)
- Embla handles touch/drag natively -- no extra library needed
- Desktop: `watchDrag: false` to prevent mouse-drag, use arrow buttons instead
- Mobile/tablet: `watchDrag: true` for swipe gestures
- Slide transition is Embla's default smooth animation
- Thumbnail strip below on mobile stays as-is (scrollable row of remaining images)

### Files changed
- **New**: `src/components/product/ProductImageGallery.tsx`
- **Edit**: `src/pages/ProductDetail.tsx` (replace gallery sections)

