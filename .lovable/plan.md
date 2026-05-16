## Problem

When you banned `alesso.cwalk@yahoo.com`, his products were deactivated (`is_active=false`). The unban flow only flips `profiles.is_banned=false` but never re-activates the products, so they remain hidden from the public site (public RLS requires `is_active=true`).

Confirmed in DB — 3 products for owner `74835c82-750e-487f-a664-60a2832d9504`:
- Televizor OLED EVO LG 48C52LA
- Sony XM5
- Masina de tuns iarba

All `approval_status=approved`, `deleted_at=null`, `is_active=false`.

## Plan

### 1. Immediate data fix (one-off)
Reactivate the 3 products for this user via an insert/update operation:

```sql
UPDATE products
SET is_active = true
WHERE owner_id = '74835c82-750e-487f-a664-60a2832d9504'
  AND approval_status = 'approved'
  AND deleted_at IS NULL
  AND is_active = false;
```

### 2. Fix the unban flow (`src/features/admin/banApi.ts`)
Currently `unbanUser` only updates the profile. Update it to also reactivate the user's previously-approved, non-deleted products so unban is symmetric to ban.

- After the profile update, run an update on `products` setting `is_active = true` for `owner_id = userId`, `approval_status = 'approved'`, `deleted_at IS NULL`.
- Keep behavior simple: we restore everything that was approved. Products that are pending/rejected/soft-deleted remain untouched.

### 3. (Optional but recommended) Notify in admin UI
No UI change required, but the admin toast on unban can mention "produsele utilizatorului au fost reactivate" so the operator knows.

## Out of scope
- Changing the ban behavior itself (we keep auto-deactivation on ban).
- Touching products that are `pending`, `rejected`, or soft-deleted.

Confirm and I'll apply both the data fix and the code change.