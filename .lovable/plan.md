

## Plan: Comision 5% + Primele 3 anunțuri gratuite

### Strategie
- Comisionul implicit al platformei scade de la **20% la 5%**
- Primele **3 produse** ale fiecărui utilizator au comision **0%**
- Comisionul se aplică per produs la momentul creării, deci produsele existente își păstrează comisionul vechi (20%) — sau le actualizăm pe toate?

### Ce se schimbă

**1. Migrare DB** — Schimbarea default-ului pe coloana `platform_fee_percent`:
```sql
ALTER TABLE public.products 
  ALTER COLUMN platform_fee_percent SET DEFAULT 5.00;
```

**2. `src/features/products/productsApi.ts`** — La crearea produsului, logica de calcul comision:
- Numără câte produse are utilizatorul deja
- Dacă are < 3 produse → `platform_fee_percent = 0`
- Dacă are >= 3 → `platform_fee_percent = 5`
- Înlocuiește hardcoded `20.0` cu această logică

**3. `src/features/rentals/rentalsApi.ts`** — Default-ul `platformFeePercent = 20` devine `5`:
```ts
platformFeePercent = 5
```

**4. UI — Formular creare produs (`src/pages/NewProduct.tsx`)** — Actualizarea calculatorului de preț care afișează comisionul (20% → 5% sau 0% pentru primele 3)

**5. UI — Formular editare produs (`src/pages/EditProduct.tsx`)** — Același lucru cu calculatorul de preț

**6. Opțional: Actualizare produse existente** — O migrare care setează `platform_fee_percent = 5` pe toate produsele existente care au 20%, pentru a reflecta noua politică

### Întrebare importantă

Trebuie clarificat: vrem să actualizăm și produsele existente la 5% (și primele 3 la 0%), sau doar produsele noi de acum încolo?

### Fișiere afectate
- `supabase/migrations/` — 1 migrare (default column + opțional update existing)
- `src/features/products/productsApi.ts` — logică comision dinamic
- `src/features/rentals/rentalsApi.ts` — default 5%
- `src/pages/NewProduct.tsx` — UI calculator
- `src/pages/EditProduct.tsx` — UI calculator

