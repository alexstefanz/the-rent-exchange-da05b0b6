

# Plan: Constrain product card images to be smaller and more contained

The images currently use `max-h-[80%] max-w-[90%]` which still lets them fill most of the container. Reduce these constraints so images are visually smaller and more "inset" with more white space around them.

## Changes

### `src/components/products/ProductCard.tsx`
- **Gallery view (line 122):** Change image from `max-h-[80%] max-w-[90%]` to `max-h-[65%] max-w-[75%]`
- **List view (line 74):** Same change: `max-h-[65%] max-w-[75%]`

### `src/components/products/NearbyProductsSlider.tsx`
- Change NearbyProductCard image from `max-h-[80%] max-w-[90%]` to `max-h-[65%] max-w-[75%]`

### `src/components/items/ItemCard.tsx`
- Change image from `max-h-[80%] max-w-[90%]` to `max-h-[65%] max-w-[75%]`

This ensures all images have consistent sizing with generous whitespace padding inside the rounded container, regardless of aspect ratio.

