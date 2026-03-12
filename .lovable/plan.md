

## Plan: Fix scroll-to-top on product-to-product navigation

### Problem
When navigating from one product to another via "Other listings from this user", the page doesn't scroll to the top properly on mobile. The user sees the title/price card first instead of the product image. This happens because `ScrollToTop` uses `behavior: "smooth"`, which races with content rendering — the smooth animation can get interrupted or miscalculated as new content loads.

### Fix
In `src/components/ScrollToTop.tsx`, change `behavior: "smooth"` to `behavior: "instant"` so the scroll happens immediately before the new page renders.

```tsx
window.scrollTo({ top: 0, behavior: "instant" });
```

### Files affected
- `src/components/ScrollToTop.tsx` — one-line change

