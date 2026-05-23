# Consistență vizuală: pagina de categorie → la fel ca /cauta

Pe `/cauta` și pe `/categorie/:slug` se afișează aceleași produse, dar arată complet diferit (hero, pills de subcategorii, sticky bar, rails, buton flotant pe mobil etc.). Aliniem categoriile la layout-ul curat din Search (vezi screenshot atașat).

## Ce devine pagina de categorie

Aceeași structură ca `Search.tsx`:

1. **Header text** – titlul categoriei (ex. „Electronice") + subtitle „Toate produsele disponibile" (în loc de hero banner).
2. **Bară de căutare mare** – input cu iconiță lupă, `max-w-2xl`, identic cu Search.
3. **Tabs** „Produse / Utilizatori" – la fel ca Search; tab-ul Users caută utilizatori (folosind `useSearchUsers`) doar când există query text. Categoria rămâne pre-aplicată pe tab-ul Produse.
4. **Bară de filtre inline** (dreapta sus, deasupra grid-ului):
   - `Toate subcategoriile` (înlocuiește dropdown-ul „Toate categoriile" din Search, întrucât suntem deja într-o categorie)
   - `Toate orașele` (orașele din `judete`, sortate RO)
   - `Interval preț`
   - `Relevanță / Preț asc / Preț desc / Cele mai noi`
   - Toggle `Grid / List`
   - Pe mobil: același `SearchFilters` sheet (cu „Subcategorie" în loc de „Categorie")
5. **Grid produse** – `grid-cols-2 lg:grid-cols-4`, `ProductCard` cu `viewMode`. Aceleași stări `EmptySearchState` / `Loader2`.

## Ce dispare de pe categorie

- `CategoryHero` (banner mare)
- `SubcategoryPills` (înlocuit cu dropdown inline „Toate subcategoriile")
- `StickyFilterBar` + buton flotant de filtre pe mobil (înlocuite cu `InlineSearchFilters` + `SearchFilters` sheet — exact ca pe Search)
- `DiscoveryRailsTop` / `DiscoveryRailsBottom`
- `MobileFilterSheet` custom
- Paginare „Încarcă mai multe" — Search nu o are; afișăm tot setul filtrat (consistent).

## Detalii tehnice

- **`src/pages/CategoryDetail.tsx`** rescris pe baza `Search.tsx`:
  - State: `searchQuery`, `activeTab`, `viewMode`, `selectedSubcategory` (default `"all"`), `selectedCity`, `priceRange`, `sortBy`.
  - `productFilters` = `{ category: category.name, ...(searchQuery && { search }), ...(selectedCity !== "all" && { location_city: selectedCity }) }`.
  - Filtrare client pentru subcategorie (`p.subcategory === selectedSubcategory`) și `priceRange` (cu `calculateClientPrice`), plus sort.
  - `hasActiveFilters` și `handleClearFilters` resetează subcat/oraș/preț/sort.
- **`src/components/search/SearchFilters.tsx`** – extindem `InlineSearchFilters` + `SearchFiltersContent` cu props opționale:
  - `subcategoryOptions?: { value: string; label: string }[]`
  - `selectedSubcategory?: string`, `onSubcategoryChange?: (v: string) => void`
  - Când `subcategoryOptions` e dat, înlocuim dropdown-ul „Toate categoriile" cu „Toate subcategoriile" (lista din `category.subcategories`, etichete bilingve RO/EN, sortate alfabetic). Search continuă să folosească categorii ca acum.
- **`SubcategoryDetail.tsx`** rămâne neatins (pagină separată, alt scope). Dacă vrei, o aliniem într-un pas următor.
- Texte noi adăugate în `src/data/uxCopy.ts` doar dacă sunt strict necesare (ex. „Toate subcategoriile" / „All subcategories"); altfel refolosim `t()` inline ca în Search.
- Fără modificări de business logic, fără query-uri noi, fără schimbări de RLS/DB.

## Fișiere modificate

- `src/pages/CategoryDetail.tsx` (rescris)
- `src/components/search/SearchFilters.tsx` (props opționale pentru subcategorii)
- (opțional) `src/data/uxCopy.ts` – 1 cheie nouă „Toate subcategoriile"

## Ce NU se schimbă

- `Search.tsx` rămâne identic vizual.
- `SubcategoryDetail.tsx`, `Categories.tsx`, navigația, rutele.
- Componentele `CategoryHero`, `SubcategoryPills`, `StickyFilterBar`, `MobileFilterSheet`, `DiscoveryRails`, `CategorySearchBar` nu mai sunt importate de `CategoryDetail`; le păstrăm în repo (pot fi șterse într-un pas separat dacă vrei curățare).
