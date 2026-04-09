

## Plan: Admin poate edita produse + notița "Editat de admin"

### Ce se schimbă

**1. DB: Adăugare coloane pe `products`** (migrare)
- `admin_edited_at` (timestamptz, nullable) — data și ora ultimei editări de admin
- `admin_edited_by` (uuid, nullable) — ID-ul adminului care a editat

**2. Actualizare funcția RPC `get_admin_products`** (migrare)
- Adăugare `admin_edited_at` și `admin_edited_by` în coloanele returnate

**3. `src/features/admin/adminProductsApi.ts`**
- Actualizare `updateProductAdmin` să seteze și `admin_edited_at = now()` + `admin_edited_by = user_id`
- Actualizare `fetchProductFullDetails` să returneze și `admin_edited_at`, `admin_edited_by`
- Actualizare interfața `AdminProduct` cu cele 2 câmpuri noi

**4. `src/pages/admin/AdminProducts.tsx`**
- Adăugare buton "Editează" în `ProductExpandedPanel` care deschide un dialog de editare
- Dialog de editare cu câmpuri: titlu, descriere, preț/zi, categorie, subcategorie, activ/inactiv
- La salvare, se apelează `updateProductAdmin` cu câmpurile + `admin_edited_at` + `admin_edited_by`
- Afișare notița "Editat de admin la [data/ora]" în panoul extins și în tabel, dacă `admin_edited_at` nu e null

**5. Afișare pe frontend (pagina de produs publică)**
- Opțional: afișare badge discret "Editat de admin" pe `ProductDetail.tsx` dacă `admin_edited_at` != null (vizibil doar proprietarului sau tuturor — de decis)

### Fișiere afectate
- DB migrare (2 coloane noi + update RPC)
- `src/features/admin/adminProductsApi.ts`
- `src/pages/admin/AdminProducts.tsx` (dialog editare + badge notificare)

