

## Plan: Simplify Homepage Featured Listings

### Changes

**File: `src/components/home/FeaturedListings.tsx`**

1. **Remove 3 sections** — Keep only one section renamed to "Închirieri populare" (EN: "Popular Rentals")
   - Delete the `sections` array and the `ProductRow` loop
   - Remove unused product slices (`topCategoryProducts`, `recentProducts`, `bestReviewedProducts`)

2. **Replace horizontal slider with a 4-column grid layout**
   - Show 7 products + 1 "See All" card in a `grid grid-cols-2 md:grid-cols-4` layout (2 rows × 4 columns on desktop, 4 rows × 2 columns on mobile)
   - Slice `allProducts` to first 7 items
   - Reuse existing product card markup and `SeeAllCard` component
   - Remove `ProductRow` component entirely (no longer needed — no horizontal scrolling, no drag logic, no scroll arrows)

3. **Update section title**
   - Romanian: "Închirieri populare"
   - English: "Popular Rentals"

4. **Adjust `SeeAllCard`** width class from the old slider width to `w-full` so it fits naturally in the grid

### Layout Result
```text
Desktop (md+):
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Product1 │ │ Product2 │ │ Product3 │ │ Product4 │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Product5 │ │ Product6 │ │ Product7 │ │ See All  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Mobile:
2 columns × 4 rows (same 7 + See All)
```

