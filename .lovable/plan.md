

## Plan: Format category badge to fit text only + single line

### Change

**`src/components/products/ProductCard.tsx`** — Update the category badge (line 174) to:
- Add `whitespace-nowrap` and `truncate` with `max-w-full` so text stays on 1 line and truncates if too long
- Reduce font size to `text-[9px] md:text-[11px]` for better fit
- Reduce padding to `px-1.5 py-0.5` so the background hugs the text tighter
- Add `rounded-sm` for a tighter pill shape

Same change applies to the **list view** variant (line 97) for consistency.

Also check and apply same fix in **`NearbyProductsSlider.tsx`** if it has the same badge pattern.

### Files affected
- `src/components/products/ProductCard.tsx` (gallery + list view badges)
- `src/components/products/NearbyProductsSlider.tsx` (if applicable)

