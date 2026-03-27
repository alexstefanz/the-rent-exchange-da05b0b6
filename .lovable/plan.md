

## Plan: Filter by Subcategory on Same Page

**Problem**: The subcategories dropdown in `CategoryDetail.tsx` navigates away to `/subcategorie/{id}`, losing context. User wants inline filtering.

### Changes in `src/pages/CategoryDetail.tsx`

1. Add a `selectedSubcategory` state (default `"all"`)
2. Change the `Select onValueChange` (line 121) from `navigate(...)` to `setSelectedSubcategory(value)`
3. Update `filteredProducts` memo to also filter by subcategory when one is selected
4. Update the empty state to show "Adaugă primul anunț" button linking to `/adauga-anunt`

### Technical detail

```tsx
// New state
const [selectedSubcategory, setSelectedSubcategory] = useState("all");

// Updated Select (line 121)
<Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>

// Updated filter memo - add subcategory filtering
let result = products.filter((p) => {
  const price = p.daily_price_owner;
  const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
  const matchesSub = selectedSubcategory === "all" || p.subcategory === selectedSubcategory;
  return matchesPrice && matchesSub;
});
```

Also add an `"all"` option to the SelectContent so users can reset the filter.

### Files changed
- `src/pages/CategoryDetail.tsx` (4 small edits)

