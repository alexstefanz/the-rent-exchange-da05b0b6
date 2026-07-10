## Problem

Secțiunea "Închirieri populare" de pe homepage folosește `useProducts()` (RPC `search_products`) fără sortare de popularitate — ordinea implicită e practic ultimele adăugate. În plus, nu există diversificare pe categorii, așa că grid-ul e dominat de aceeași categorie (ex. Sport apare de 4x în screenshot).

## Soluție

Introducem un mod dedicat "popular + divers" pentru cele 8 carduri de pe homepage, complet izolat de restul aplicației (fără modificări la Search, Category, etc.).

### 1. Backend — nou RPC `get_homepage_popular_products`

Un singur SECURITY DEFINER care returnează maxim 8 produse `approved` + `deleted_at IS NULL`, scorate după popularitate reală și diversificate pe categorie.

Formula scor (produs):
- rentals confirmate/active/completed în ultimele 90 zile × 3
- total rentals (istoric) × 1
- reviews count × 2
- rating mediu × 1
- mic tie-break pe `created_at` (recency slabă)

Diversificare: după sortarea pe scor descrescător, aplicăm un pas de "round-robin pe categorie" — maxim 2 produse per categorie în top 8 dacă există suficientă varietate; altfel completăm cu ce a rămas.

Returnează aceleași coloane ca `search_products` (PRODUCT_SAFE_COLS) ca să fie drop-in cu tipul `Product`.

Grant: `EXECUTE ... TO anon, authenticated`.

### 2. Frontend — `FeaturedListings.tsx`

- Înlocuim `useProducts()` cu un nou hook `useHomepagePopularProducts()` care apelează RPC-ul de mai sus, cache 5 min.
- Restul componentului (grid, favorite, rating overlay) rămâne identic.
- Fallback: dacă RPC întoarce <4 produse (proiect nou), completăm cu `useProducts()` existente pentru a nu avea secțiune goală.

### 3. Nemodificat

- Categoriile, hero, USP bar, rails din CategoryDetail, Search — toate rămân neatinse.
- Nicio schimbare la RLS, produse, sau categorii.

## Fișiere afectate

- **Nou:** `supabase/migrations/<timestamp>_homepage_popular_products.sql` — RPC + grants.
- **Nou:** `src/hooks/queries/useHomepagePopularProducts.ts` — hook TanStack Query.
- **Editat:** `src/components/home/FeaturedListings.tsx` — swap sursă produse + fallback.

## Rezultat vizual

Cele 8 carduri din "Închirieri populare" vor arăta produse cu istoric real de închirieri / review-uri, distribuite pe categorii diferite (ex. 1-2 Sport, 1 Electronice, 1 Grădinărit, 1 Foto, 1 Camping etc.), în loc de ultimele 8 adăugate.
