

## Plan: Fix — Adăugare coloane lipsă pe `products`

### Problema
Migrarea anterioară a actualizat funcția RPC `get_admin_products` să returneze `p.admin_edited_at` și `p.admin_edited_by`, dar **coloanele nu au fost create pe tabela `products`**. Rezultat: eroare 400 și lista goală.

### Soluție
O singură migrare SQL care adaugă cele 2 coloane:

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS admin_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_edited_by uuid;
```

### Fișiere afectate
- Doar migrare DB (un singur statement ALTER TABLE)

Nu e nevoie de modificări în cod — API-ul și UI-ul sunt deja pregătite pentru aceste coloane.

