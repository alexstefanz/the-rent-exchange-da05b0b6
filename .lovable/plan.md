# Căutare insensibilă la diacritice

## Problema
Când scrii "roaba" nu apare nimic, dar "roabă" găsește produsul. Cauza: query-ul folosește `ILIKE '%roaba%'` direct pe `title`, iar PostgreSQL nu tratează `a`=`ă`, `s`=`ș`, `t`=`ț`, `i`=`î`, `a`=`â` ca echivalente.

Normalizarea există deja client-side (`normalizeDiacritics`) dar e aplicată doar pe locație, nu și pe căutarea din titlu — și oricum nu ajută, pentru că datele din DB conțin diacriticele originale.

## Soluție
Folosim extensia `unaccent` (deja instalată în proiect) prin **o funcție RPC** care normalizează ambele părți ale comparației direct în SQL:

```
unaccent(lower(title)) ILIKE unaccent(lower('%roaba%'))
```

Astfel "roaba", "roabă", "ROABĂ" găsesc toate același produs, indiferent de cum e scris în DB.

## Modificări

### 1. Migrație SQL nouă
- Funcție `public.search_products(_search text, _category text, _subcategory text, _location_city text)` cu `SECURITY INVOKER`, `STABLE`, returnează `SETOF public.products`.
- Filtrează pe `is_active = true` și `approval_status = 'approved'`.
- Aplică `unaccent` pe titlu, descriere și locație pentru match insensibil la diacritice.
- Index funcțional `idx_products_title_unaccent_trgm` pe `unaccent(lower(title))` cu `gin_trgm_ops` pentru performanță.
- Aceeași logică pentru locație (înlocuiește filtrul ILIKE existent).

### 2. `src/features/products/productsApi.ts`
- `getProducts()` apelează noua RPC `supabase.rpc('search_products', { ... })` în loc de `.from('products').select().ilike(...)`.
- Păstrăm semnătura `ProductFilters` neschimbată — restul aplicației nu se modifică.
- Restul funcțiilor (getProductById, getMyProducts, etc.) rămân cum sunt.

### 3. (Opțional, dacă timpul permite) `getPublicUserProducts` și `getNearbyProducts`
- Acestea nu fac search pe titlu, deci rămân neschimbate.

## Rezultat
- "roaba" → găsește "Roabă de grădină"
- "masina" → găsește "Mașină de tuns iarba"
- "tepusa" → găsește "Țepușă"
- Locațiile rămân tolerante la diacritice (deja funcționau, dar acum prin unaccent în loc de normalizare client-side).
