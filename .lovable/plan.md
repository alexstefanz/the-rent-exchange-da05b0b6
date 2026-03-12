

## Plan: Product Approval Flow (Admin Confirmation Before Publishing)

Currently, products are created with `is_active: true` and immediately visible. We need to add an approval step so new products start as pending and only become visible after admin approval.

### 1. Database Migration
Add an `approval_status` column to the `products` table:
```sql
ALTER TABLE public.products ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';
```
Values: `pending`, `approved`, `rejected`.

Update the RLS policy "Anyone can view active products" to also require `approval_status = 'approved'`:
```sql
DROP POLICY "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO public
  USING (is_active = true AND approval_status = 'approved');
```

### 2. Update `src/features/products/productsApi.ts`
- In `createProduct`: set `is_active: false` (product hidden until approved) — or keep `is_active: true` but rely on the RLS `approval_status = 'approved'` filter. Safest: insert with `approval_status: 'pending'`.
- Add `approval_status` to the `Product` interface.
- In `getProducts`, `getPublicUserProducts`, `getNearbyProducts`: add `.eq("approval_status", "approved")` filter.
- In `getMyProducts`: no filter on approval_status (owners should see their own pending products).

### 3. Update `src/pages/NewProduct.tsx`
- After successful creation, show a message like "Anunțul tău a fost trimis spre aprobare. Vei fi notificat când va fi publicat." instead of redirecting to the product page.

### 4. Update `src/features/admin/adminProductsApi.ts`
- Add `approval_status` to the `AdminProduct` interface.
- Add functions: `approveProduct(productId)` and `rejectProduct(productId, reason)`.

### 5. Update `src/pages/admin/AdminProducts.tsx`
- Show `approval_status` badge (Pending/Approved/Rejected) in the products table.
- Add "Aprobă" and "Respinge" actions in the dropdown menu for pending products.
- Add a filter tab or filter option to show pending products first.

### 6. Update owner's product list (Dashboard / Profile)
- In `getMyProducts` results, show a status badge on the owner's product cards indicating pending/approved/rejected status so owners know their listing status.

### Files affected
- DB migration (new column + updated RLS policy)
- `src/features/products/productsApi.ts`
- `src/pages/NewProduct.tsx`
- `src/features/admin/adminProductsApi.ts`
- `src/pages/admin/AdminProducts.tsx`
- Owner dashboard components showing product status

