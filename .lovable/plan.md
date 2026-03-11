

## Plan: Move filters inline between tabs and grid/list toggle

### Changes

**`src/pages/Search.tsx`**

1. **Remove the sidebar filter** — delete the `<div className="hidden lg:block">` wrapping `<SearchFilters>` inside TabsContent (lines 97-99), and remove the `flex gap-8` wrapper around the sidebar + content
2. **Add inline filters** in the toolbar bar (line 72-93) between TabsList and the grid/list buttons: render 3 inline `Select` dropdowns (Category, Sort) + a price range popover, directly in the top bar
3. **Update product grid** to use `grid-cols-2 lg:grid-cols-4` instead of `lg:grid-cols-3` since sidebar is gone
4. **Keep mobile Sheet** — on small screens, keep the existing Sheet-based filter (already in the toolbar via `lg:hidden`)

**`src/components/search/SearchFilters.tsx`**

5. **Add new inline variant**: Export an `InlineSearchFilters` component that renders Category select, price range (as a Popover with slider inside), and Sort select — all inline with `flex items-center gap-3`, hidden on mobile (`hidden lg:flex`)
6. **Keep Sheet variant** for mobile unchanged

### Layout after changes
```text
[Produse 11] [Utilizatori]   [Categorie ▼] [Preț ▼] [Sortare ▼] [Clear]   [⊞] [≡]
```

### Files affected
- `src/pages/Search.tsx`
- `src/components/search/SearchFilters.tsx`

