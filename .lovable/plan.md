

## Plan: Separate Admin Page for Product Approvals

Create a dedicated "Confirmări Anunțuri" page in the admin panel that shows only pending products with full details for review.

### Changes

**1. New page: `src/pages/admin/AdminApprovals.tsx`**
- Fetches products with `status_filter = 'pending'` using existing `fetchAdminProducts`
- Displays each pending product as a detailed card (not a table row) showing:
  - All product images (gallery/carousel)
  - Title, category, subcategory
  - Daily price (owner price)
  - Description (full text)
  - Included items list
  - City, country, pickup address
  - Owner name
  - Created date
- Each card has "Aprobă" and "Respinge" action buttons
- Reject opens a dialog for reason input
- Uses existing `approveProduct` and `rejectProduct` from `adminProductsApi`

**2. Update sidebar: `src/components/admin/AdminSidebar.tsx`**
- Add new menu item "Confirmări" with `ClipboardCheck` icon, URL `/admin/approvals`
- Place it after "Produse" in the menu list

**3. Update router: `src/App.tsx`**
- Lazy-load `AdminApprovals`
- Add route `/admin/approvals`

**4. Update `src/features/admin/adminProductsApi.ts`**
- Extend `AdminProduct` interface to include `description`, `subcategory`, `included_items`, `location_country`, `pickup_address` fields
- Update `get_admin_products` RPC call — the existing DB function already returns `description` and `subcategory`. For `included_items`, `location_country`, and `pickup_address`, we need a new DB function or a direct query for pending products.

**5. New DB function (migration): `get_admin_pending_products`**
- Returns all product fields plus owner name for pending products
- Includes: `id, title, description, category, subcategory, daily_price_owner, location_city, location_country, pickup_address, images, included_items, owner_id, owner_name, slug, created_at, approval_status`
- Security definer, admin-only

### Files changed
- `src/pages/admin/AdminApprovals.tsx` (new)
- `src/components/admin/AdminSidebar.tsx` (add menu item)
- `src/App.tsx` (add route)
- `src/features/admin/adminProductsApi.ts` (add fetch function for pending products with full details)
- DB migration: new `get_admin_pending_products` function

