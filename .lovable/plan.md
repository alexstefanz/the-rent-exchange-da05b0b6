

## Plan: Redesign CategoryDetail page layout

### Changes to `src/pages/CategoryDetail.tsx`

1. **Remove icon and number badge** from the title area (lines 57, 60-62) — keep only the category name `<h1>` and subtitle text

2. **Reorder sections**: Show product listings **first**, then subcategories dropdown

3. **Replace subcategory grid with a dropdown** (Select component) in the header area:
   - Position it to the right of the "Anunțuri în categorie" title
   - Each option shows subcategory name + product count in parentheses (e.g., "Biciclete (5)")
   - Selecting a subcategory navigates to `/subcategorie/{id}`
   - Need to fetch per-subcategory product counts from the database (query products grouped by subcategory)

4. **Product count per subcategory**: Use the already-fetched `products` array and group by `subcategory` field to get counts, or run a separate query. Will use the existing products data and count by subcategory match.

### Layout structure (after changes)
```text
< Înapoi la Categorii

OUTDOOR & AVENTURĂ
12 subcategorii disponibile • 2 anunțuri

Anunțuri în categorie          [Dropdown: Subcategorii ▼]

[product grid...]
```

### Files affected
- `src/pages/CategoryDetail.tsx`

