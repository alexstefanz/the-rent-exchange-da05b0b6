

## Plan: Add Price Filter, Sort, and Grid/List Toggle to Category Detail Page

### What
Add three inline filter controls next to the existing subcategory dropdown on `CategoryDetail.tsx`:
1. **Price range popover** ("Interval preț") — same as search page
2. **Sort dropdown** ("Relevanță") — relevance, price asc, price desc
3. **Grid/List toggle buttons** — same as SubcategoryDetail page

### Changes

**File: `src/pages/CategoryDetail.tsx`**

1. **Add state** for `priceRange`, `sortBy`, and `viewMode`
2. **Move the filter bar** (line 94-114) to include all 4 controls in a single row:
   - Subcategory dropdown (existing)
   - Price range popover (using `Popover` + `Slider`, reusing pattern from `SearchFilters.tsx`)
   - Sort by select (Relevanță, Preț crescător, Preț descrescător)
   - Grid/List toggle (using `Grid3X3` and `List` icons, same pattern as `SubcategoryDetail`)
3. **Add filtering logic** — `useMemo` to filter products by price range and sort by selected order
4. **Update product grid** — switch between grid and list view based on `viewMode`, pass `viewMode` prop to `ProductCard`

### Layout (desktop)
```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────┬────┐
│ Subcategorii │ │ Interval preț│ │  Relevanță   │ │ ⊞ │ ☰ │
└──────────────┘ └──────────────┘ └──────────────┘ └────┴────┘
```

### Imports to add
- `Grid3X3`, `List` from lucide-react
- `Popover`, `PopoverContent`, `PopoverTrigger` from ui/popover
- `Slider` from ui/slider
- `useState`, `useMemo` (useState already imported partially)

### No new files needed — all patterns already exist in the codebase.

