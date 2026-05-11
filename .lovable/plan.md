## Probleme identificate pe `/categorie/:slug`

Am verificat datele și codul din `src/pages/CategoryDetail.tsx` + `src/components/category/StickyFilterBar.tsx`.

### 1. Filtru oraș (ex: „Iași") returnează 0 rezultate
În baza de date `products.location_city` este salvat fără diacritice și cu majuscule inconsistente (`"Iasi"`, `"iasi"`), dar chip-urile din `StickyFilterBar` trimit valori cu diacritice (`"Iași"`, `"Cluj-Napoca"` etc.). Comparația `p.location_city !== quickFilters.city` este strictă, deci nu prinde nimic.

**Fix:** normalizare la comparație — `stripDiacritics(value).toLowerCase()` pe ambele părți. Aceeași logică va fi folosită și pentru `MobileFilterSheet`.

### 2. Sortarea nu pare să funcționeze
Sortarea (`sortBy`) este aplicată corect în `filteredProducts`, dar grid-ul filtrat este randat **doar** când `hasActiveFilters === true`. În mod browse (fără filtre) se afișează doar `DiscoveryRails`, care nu țin cont de `sortBy`. Deci utilizatorul schimbă „Sortare" și nu vede nicio diferență.

**Fix:** 
- Includem `sortBy !== "relevance"` și schimbarea `viewMode` în logica „mod filtru activ", SAU
- Mai bine: afișăm întotdeauna grid-ul principal cu produse (sortat + în viewMode-ul ales). `DiscoveryRails` rămân vizibile deasupra doar când nu există filtre, ca secțiune de descoperire.

Voi alege a doua variantă (mai clară): jos rămâne mereu grila completă a categoriei, sortarea și view mode au efect imediat.

### 3. Grid / List view toggle nu funcționează
Aceeași cauză ca sortarea: `viewMode` este folosit doar în blocul randat când `hasActiveFilters`. Va fi rezolvat odată cu #2 (grila principală e mereu vizibilă, deci toggle-ul are efect).

---

## Modificări tehnice (doar frontend)

**`src/pages/CategoryDetail.tsx`**
- Adaug helper `normalizeCity(s)` (strip diacritics + lowercase) și folosesc în filtrul `quickFilters.city`.
- Refactor randare:
  - `DiscoveryRails` se afișează deasupra doar când `!hasActiveFilters && products.length > 0`.
  - Sub el, randez **întotdeauna** „Toate produsele din {categorie}" cu grid-ul `filteredProducts` în `viewMode`-ul curent (paginat cu „Încarcă mai multe").
  - `EmptyCategoryState` apare doar când `filteredProducts.length === 0` (cu sau fără filtre).
- Header de rezultate (`{N} rezultate` + `Resetează`) afișat și în mod browse, dar fără butonul Reset când nu sunt filtre.

**`src/components/category/StickyFilterBar.tsx`**
- Marcaj vizual „active" pe chip-ul de oraș folosește aceeași normalizare (ca să se evidențieze chiar dacă valoarea internă e deja normalizată).

Nu se modifică queries, RLS sau API-uri.