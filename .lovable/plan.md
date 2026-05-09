## Obiectiv
Când un user șterge un produs din "Anunțurile mele", produsul nu se șterge definitiv. Intră într-un coș de gunoi vizibil în Admin Dashboard timp de **14 zile**, de unde adminul poate face **Restore**. După 14 zile, produsul se șterge automat.

## Schimbări DB (migrație)

1. `products`: adăugare coloană `deleted_at TIMESTAMPTZ NULL` + `deleted_by UUID NULL`.
2. Index parțial: `CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;`
3. Politici RLS actualizate ca să excludă produsele șterse:
   - `Anyone can view active products` → adaugă `AND deleted_at IS NULL`
   - `Owners can view their own products` → adaugă `AND deleted_at IS NULL` (ownerul nu mai vede în lista lui produsele șterse — sunt doar la admin)
   - `Admins can view all products` rămâne neschimbat (vede și cele șterse).
4. Politica nouă: adminii pot face UPDATE pentru `deleted_at` (acoperită deja de "Admins can update all products").
5. **Cron job pgmq/cron**: edge function programată zilnic care face `DELETE FROM products WHERE deleted_at < now() - interval '14 days'`. Folosesc `pg_cron` direct cu o funcție `purge_expired_deleted_products()`.

## Schimbări backend (API)

`src/features/products/productsApi.ts`:
- `deleteProduct(id, ownerId)` → schimbă din `.delete()` în `.update({ deleted_at: now, deleted_by: ownerId })`.

`src/features/admin/adminProductsApi.ts`:
- `deleteProduct(productId)` (admin hard-delete) rămâne (admin poate șterge definitiv din coș).
- `fetchDeletedProducts()`: SELECT cu `deleted_at IS NOT NULL` ordonat DESC, include `owner_name`, `deleted_at`, `deleted_by`.
- `restoreProduct(productId)`: `UPDATE products SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL`.
- `fetchAdminProducts()` (lista normală): adaugă filtru `.is('deleted_at', null)` ca să nu apară amestecate.

## Schimbări UI

1. **`src/pages/admin/AdminProducts.tsx`**: adaug tabs sus — `Active` (default) | `Coș de gunoi (X)`.
   - Tab "Coș de gunoi" arată tabel simplificat: imagine, titlu, owner, `deleted_at`, **zile rămase** (14 - days_since_deleted), buton **Restore** + buton **Șterge definitiv**.
   - Badge cu count de produse din coș.

2. **`src/pages/Owner.tsx`** și **`src/components/dashboard/LendingsTab.tsx`**: confirmation dialog actualizează textul: "Produsul va fi mutat în coșul de gunoi pentru 14 zile, apoi șters definitiv."

## Localizare
Adaug chei în `src/data/uxCopy.ts`:
- `trash`, `restore`, `deletePermanently`, `deletedAt`, `daysRemaining`, `softDeleteWarning`.

## Scope
- 1 migrație DB (coloane + RLS + funcție pgcron)
- `src/features/products/productsApi.ts`
- `src/features/admin/adminProductsApi.ts`
- `src/pages/admin/AdminProducts.tsx`
- `src/pages/Owner.tsx`, `src/components/dashboard/LendingsTab.tsx` (doar text dialog)
- `src/data/uxCopy.ts`