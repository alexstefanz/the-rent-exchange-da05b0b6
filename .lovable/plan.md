## Obiectiv

Oprim expunerea către vizitatori anonimi și ceilalți useri autentificați (non-owner, non-admin) a coloanelor sensibile din `public.products`:
`serial_number`, `pickup_address`, `pickup_lat`, `pickup_lng`, `admin_flagged`, `flag_reason`, `admin_edited_at`, `admin_edited_by`.

Owner-ul și adminii păstrează acces complet prin RPC-uri SECURITY DEFINER.

## Migrație (un singur fișier)

1. `REVOKE SELECT (pickup_address, pickup_lat, pickup_lng, serial_number, admin_flagged, flag_reason, admin_edited_at, admin_edited_by) ON public.products FROM anon, authenticated;`
2. RPC-uri noi SECURITY DEFINER (`search_path = public`):
   - `get_product_sensitive_fields(_id uuid)` → returnează cele 8 câmpuri dacă `auth.uid() = owner_id` SAU `has_role(auth.uid(),'admin')`, altfel rând gol.
   - `get_my_products_sensitive()` → tabel `(id, pickup_address, pickup_lat, pickup_lng, serial_number)` pentru produsele caller-ului.
   - `get_admin_products_sensitive(_ids uuid[])` → toate cele 8 câmpuri per id, doar pentru admini.
3. `get_my_product_serial` deja există — păstrat pentru compatibilitate.

## Modificări de cod

- `src/features/products/productsApi.ts`
  - `getProductById` / `getProductBySlug` / `getProducts` / `getPublicUserProducts` / `getMyProducts`: înlocuim `.select("*")` cu listă explicită de coloane safe.
  - `getMyProducts`: după fetch, merge câmpurile sensibile via `get_my_products_sensitive()`.
  - `createProduct` / `updateProduct`: `.select()` doar pe coloane non-sensitive (RETURNING-ul Postgres respectă grant-urile de coloană).
  - Comentariu pe interfața `Product` că aceste câmpuri sunt populate doar pentru owner/admin.

- `src/features/admin/adminProductsApi.ts`
  - Direct selecturile pe `admin_flagged`, `flag_reason`, `admin_edited_*`, `pickup_address` → înlocuite cu `get_admin_products_sensitive(ids)` și merge by id.
  - `.update()` continuă să funcționeze (REVOKE-ul e doar pe SELECT); doar scoatem coloanele din `.select()` returning.

- `src/pages/admin/AdminProducts.tsx`, `src/pages/admin/AdminApprovals.tsx`
  - Folosesc RPC-ul admin pentru a popula flag-urile de moderare și adresa de pickup în UI.

- `src/components/publish/PublishWizard.tsx` & `src/pages/PublishProduct.tsx`
  - La edit, hidratează `pickup_address`, `pickup_lat`, `pickup_lng`, `serial_number` via `get_product_sensitive_fields(id)`. Deja făcut pentru `serial` — extindem.

- `src/components/home/FeaturedListings.tsx`, `src/components/products/ProductCard.tsx`, `src/pages/ProductDetail.tsx`
  - Scoatem `product.pickup_address` din randările publice (fallback pe `location_city`, care e deja default-ul). Pentru chiriași cu booking activ, fluxul existent `get_rental_renter_info` continuă să livreze adresa completă.

## Risc & validare

- După migrație, orice `.select("*")` din `products` eșuează pentru anon/authenticated. Toate locurile identificate prin grep sunt incluse mai sus.
- `insert/update().select("*")` eșuează la fel — trecem pe liste explicite.
- Smoke test după aplicare: home, product detail (delogat + cumpărător + owner), publish wizard edit, tab admin products.

Dacă aprobi, aplic migrația și schimbările de cod într-un singur batch.