

## Plan: Enforce Admin Approval Before Product Visibility

The approval system is **partially built** -- admin UI for approve/reject exists, Owner page shows pending badges. But products are currently created with `is_active: true`, bypassing approval entirely.

### Changes needed

#### 1. Database migration -- tighten RLS policy
Update the "Anyone can view active products" RLS policy to also require `approval_status = 'approved'`:
```sql
DROP POLICY "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT TO public
  USING (is_active = true AND approval_status = 'approved');
```

#### 2. `productsApi.ts` -- create products as pending
Change `createProduct` to set `is_active: false` so new products are invisible until admin approval. The admin `approveProduct` function already sets `is_active: true`.

#### 3. `productsApi.ts` -- filter public queries
Add `approval_status = 'approved'` filter to `getProducts()`, `getPublicUserProducts()`, and `getNearbyProducts()` so unapproved products never appear in listings.

#### 4. `NewProduct.tsx` -- update success message
Change the toast from "Anunțul a fost publicat" to "Anunțul tău a fost trimis spre aprobare. Vei fi notificat când este aprobat."

#### 5. `Owner.tsx` -- no changes needed
Already shows pending/rejected badges correctly.

### Impact
- New products: invisible until admin approves
- Existing approved products: unaffected
- Admin workflow: already functional (approve/reject buttons exist)
- Owner dashboard: already shows status badges

