## Problem

Ștergerea din contul propriu (`ListingsPage` → „Șterge definitiv") apelează `deleteProduct()` care face un **soft-delete** printr-un `UPDATE products SET deleted_at = now(), deleted_by = uid`.

Baza de date are triggerul `trg_enforce_products_owner_update` (BEFORE UPDATE) care ridică excepție dacă un non-admin modifică oricare din câmpurile: `approval_status`, `admin_flagged`, `flag_reason`, `quality_score`, `admin_edited_at`, `admin_edited_by`, `owner_id`, **`deleted_at`**, **`deleted_by`**.

Deci owner-ul apasă butonul, Supabase returnează eroare („Not allowed to modify admin-controlled product fields"), UI-ul închide dialogul dar produsul rămâne. De aceea „nu se șterge deloc".

Confirmat pe produsul real din DB: `Tastatura Gaming SteelSeries Apex 3` (id `9f481a3d…`), `deleted_at = NULL`.

## Fix

Migrare care înlocuiește `enforce_products_owner_update` astfel încât să **permită** owner-ului să facă tranziția `deleted_at: NULL → timestamp` (împreună cu `deleted_by = auth.uid()`) pe propriul produs. Orice altă modificare a acestor două câmpuri (revert la NULL, schimbare de dată, `deleted_by` diferit) rămâne interzisă non-adminilor.

Pseudo-cod:

```text
if admin -> allow
soft_delete_by_owner :=
   OLD.deleted_at IS NULL
   AND NEW.deleted_at IS NOT NULL
   AND NEW.deleted_by = auth.uid()
   AND OLD.owner_id  = auth.uid()
if soft_delete_by_owner -> ignora deleted_at/deleted_by la verificare
altfel pastreaza verificarile existente
```

Restul câmpurilor admin (approval_status etc.) rămân protejate identic.

## Ce NU se schimbă

- RLS pe `products` (deja corectă: `Owners can update their own products` USING/WITH CHECK pe `owner_id`).
- `deleteProduct()` din client — logica soft-delete rămâne aceeași.
- Comportamentul de admin (poate face orice pe produse).

## Verificare

1. Rulez migrarea.
2. Din UI, șterg produsul de test „Tastatura Gaming SteelSeries Apex 3" și confirm în DB că `deleted_at` este setat.
3. Verific că listarea „Anunțurile mele" nu-l mai afișează (query filtrează `deleted_at IS NULL`).
