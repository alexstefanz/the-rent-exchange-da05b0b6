# Fix: filtrele de locație par „rupte" (Iași = 0 rezultate)

## Diagnostic
Am verificat în DB toate anunțurile din categoria **Unelte**:

| Titlu | Oraș | Preț/zi |
|---|---|---|
| autofiletantă cu impact | iasi | 2 RON |
| Ciocan demolator | Iasi | 2 RON |
| Ferăstrău spadă | Iasi | 1 RON |
| Trusă universală | Iasi | 1 RON |
| Manitou MRT 2150+ | Iasi | 2 RON |

Toate sunt în Iași. RPC-ul `search_products` folosește deja `unaccent + lower + LIKE`, deci „Iași" / „Iasi" / „iasi" se potrivesc corect — **filtrul de locație nu e bug-ul**.

**Cauza reală**: în screenshot-ul tău sliderul **Interval preț** e setat la **90–370 RON**. Filtrul client-side din `CategoryDetail.tsx` (linia 107) elimină orice produs cu preț < 90 RON. Toate uneltele tale (1–2 RON) cad sub această valoare → 0 rezultate, indiferent de oraș.

Plus, când schimbi orașul în „Resetează filtrele" intervalul de preț **NU** se resetează — rămâne 90–370 și ascunde tot.

## Soluție (UX + cod, fără modificări DB)

### 1. Slider de preț dinamic per categorie
În loc de `max=1000` fix, calculez `min`/`max` din produsele încărcate pentru categoria curentă. Inițializez `priceRange` cu `[minActual, maxActual]`. Astfel, când deschizi Unelte, sliderul e 1–2 RON, iar Drumeții poate fi 90–370 RON. Nu mai există situații „sub minimul aparent".

### 2. Empty state inteligent
Dacă `products.length > 0` dar `filteredProducts.length === 0`, afișez un mesaj clar:
> „Niciun rezultat cu filtrele curente. Există X anunțuri în această categorie."

cu buton **„Resetează filtrele"** care apelează `handleClearFilters()`. Înlocuiește `EmptySearchState` generic în acest caz.

### 3. Reset complet la „Resetează filtrele"
Verific că `handleClearFilters` resetează și `priceRange` la `[minActual, maxActual]` (azi probabil îl resetează la `[0, 1000]` care nu mai e corect cu sliderul dinamic).

## Fișiere afectate
- `src/pages/CategoryDetail.tsx` — calcul `priceBounds` din `products`, init `priceRange`, empty state condițional, `handleClearFilters` actualizat.
- (Opțional) `src/components/search/SearchFilters.tsx` — accept props `priceMin` / `priceMax` pentru slider, fallback `0`/`1000`.

## Notă
Aceeași logică se aplică și pe `/cauta` (Search.tsx) — fac extensia și acolo în același pas pentru consistență.
