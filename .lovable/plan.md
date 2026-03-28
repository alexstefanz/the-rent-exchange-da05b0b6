

## Plan: Expandable Product Rows with Full Details and Actions

**Goal**: Replace the dropdown "Acțiuni" menu with an expandable accordion row. Clicking a product row expands it to show all product details + action buttons inline. Make the entire admin products page mobile-responsive.

### Changes in `src/pages/admin/AdminProducts.tsx`

**1. Add expandable row state**
- Add `expandedProductId` state to track which row is expanded
- Clicking a `TableRow` toggles expansion (sets or clears the ID)

**2. Replace table layout on mobile with card-based list**
- On desktop (`md+`): keep the current table but replace the "Acțiuni" dropdown column
- On mobile (`< md`): render products as stacked cards with key info (image, title, price, status) and an expand/collapse toggle
- Use responsive classes (`hidden md:table` / `md:hidden`) to switch layouts

**3. Expandable detail panel (both layouts)**
When a product is expanded, show a detail section containing:
- **Images**: horizontal scrollable gallery of all product images
- **Details grid**: Title, Description, Category, Subcategory, Price/day, Owner name, City, Country, Created date, Approval status
- **Action buttons**: All current dropdown actions rendered as visible buttons:
  - "Vezi pe site" (link)
  - "Aprobă" / "Respinge" (if pending)
  - "Activează" / "Dezactivează"
  - "Marchează suspect" / "Ridică flag"
  - "Recenzii"
  - "Șterge definitiv" (destructive)

**4. Remove DropdownMenu column**
- Remove the `<TableHead>Acțiuni</TableHead>` and the corresponding `<TableCell>` with `DropdownMenu`
- Actions now live inside the expanded panel only

**5. Fetch additional product details on expand**
- The existing `get_admin_products` RPC already returns `description`, `images`, `subcategory`
- For extra fields (included_items, pickup_address, location_country), add a `fetchProductFullDetails` function that queries the `products` table directly by ID when a row is expanded

### New function in `src/features/admin/adminProductsApi.ts`
```typescript
export const fetchProductFullDetails = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('description, included_items, location_country, pickup_address, usage_rules')
    .eq('id', productId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
```

### Files changed
- `src/pages/admin/AdminProducts.tsx` — major refactor: expandable rows, mobile card layout, inline actions
- `src/features/admin/adminProductsApi.ts` — add `fetchProductFullDetails`

