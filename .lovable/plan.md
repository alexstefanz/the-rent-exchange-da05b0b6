

## Plan: Add subcategories to Dashboard Categories Widget

The `DashboardCategoriesWidget` on the admin dashboard currently only shows main categories. Subcategories need to appear as expandable dropdowns under each category, with edit/delete actions.

### Changes to `src/components/admin/DashboardCategoriesWidget.tsx`

1. **Fetch subcategories** -- add a `useQuery` call for `fetchSubcategories` (already exported from `categoriesApi`)
2. **Expandable rows** -- wrap each category row in a collapsible/accordion so clicking it reveals its subcategories listed below, indented
3. **Subcategory actions** -- each subcategory row gets Edit (pencil) and Delete (trash) buttons, same as categories
4. **Edit subcategory dialog** -- add a dialog with fields: name (RO), name (EN), description, image URL, sort order (reusing the pattern from `AdminCategories.tsx`)
5. **Delete subcategory confirmation** -- add an AlertDialog for subcategory deletion
6. **Mutations** -- add `updateSubcategory`, `deleteSubcategory` mutations using existing API functions from `categoriesApi`

### UI Structure
```text
Category Row (clickable to expand)
  ├── Subcategory 1  [Active] [Edit] [Delete]
  ├── Subcategory 2  [Active] [Edit] [Delete]
  └── Subcategory 3  [Active] [Edit] [Delete]
```

### Files modified
- **`src/components/admin/DashboardCategoriesWidget.tsx`** -- add subcategory fetching, accordion display, edit/delete dialogs and mutations

