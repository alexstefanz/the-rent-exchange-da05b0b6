

## Plan: Make BookingCard sticky with scroll limit at reviews section

### Problem
The booking sidebar card needs to stay fixed while scrolling, but stop scrolling when it reaches the reviews section.

### Approach
Use a `useRef` + `useEffect` with `IntersectionObserver` or scroll event to detect when the reviews section is in view, and switch the card from `sticky` to `relative` positioning. A simpler CSS-only approach: wrap the left column content up to (but not including) NearbyProductsSlider in a container that acts as the sticky boundary.

**Simpler solution**: The `sticky` element stops being sticky when its parent container ends. Currently the sidebar parent is `div.lg:col-span-1` which spans the full grid. We need to give this parent a defined height that ends at the reviews section boundary.

**Best approach**: Use JavaScript to calculate the stop point. Add a ref to the reviews section and use a scroll listener to toggle between `sticky` and `relative` when the card would overlap reviews.

### Changes to `src/pages/ProductDetail.tsx`

1. Add a `ref` to the reviews section div (line 251)
2. Add a `ref` to the sidebar container (line 277)
3. Add a `useEffect` with scroll listener that:
   - Gets the reviews section top position
   - Gets the sidebar card height
   - When `scrollY + card.offsetTop + card.height > reviews.top`, switch card to `relative` + calculated top
4. Alternatively (cleaner): set `max-height` on the sidebar column wrapper to match the left column height up to the reviews section, so `sticky` naturally stops there.

**Cleanest implementation**: Use `position: sticky` with a wrapper div whose height is constrained. Add an `id="reviews-section"` to the reviews div, and use a `useRef` + `ResizeObserver` to set the sidebar wrapper height dynamically.

### Implementation
- Add `useRef` for reviews section
- Add `useRef` for sidebar wrapper  
- Add `useEffect` that calculates and sets the sidebar wrapper's `style.height` to match the distance from grid top to reviews section top
- This makes `sticky` naturally stop before reviews

