# Harta condusă de cuvântul cheie

Harta afișează doar anunțurile care conțin cuvântul căutat („cort”, „laptop”, „PlayStation”), atât pe pagina de căutare, cât și pe paginile de categorie.

## Ce se schimbă pentru utilizator

**1. Mod hartă pe pagina de căutare (`/cauta`)**
- Se adaugă un al treilea mod de vizualizare: Hartă / Grid / Listă, cu harta setată implicit (ca la categorii), memorată în URL prin `?view=`.
- Harta arată exclusiv rezultatele căutării curente: scrii „cort”, pe hartă rămân doar pinurile anunțurilor cu „cort”. Filtrele existente (județ, localitate, preț, sortare) se aplică peste, la fel ca acum.
- Se păstrează layout-ul Airbnb existent (split 58/42 pe desktop, hartă sticky sus pe mobil/tabletă, 19 anunțuri per pagină, carduri 2 pe rând).

**2. Căutarea din pagina de categorie iese din limita categoriei**
- Azi, dacă ești în „Camping” și scrii „laptop”, nu găsești nimic pentru că se caută doar în acea categorie.
- După schimbare, când există un cuvânt cheie, căutarea se face în toate categoriile, iar sub bara de căutare apare o linie de context: „Rezultate pentru «laptop» din toate categoriile” + un buton „Caută doar în Camping” pentru cine vrea limitarea.
- Fără cuvânt cheie, pagina rămâne strict pe categoria curentă, ca acum.

**3. Zero rezultate: mesaj + sugestii**
- Când niciun anunț nu corespunde cuvântului cheie, harta rămâne vizibilă (fără pinuri) iar panoul de anunțuri afișează: „Niciun anunț pentru «cort»”, explicație scurtă, buton „Șterge căutarea”.
- Sub mesaj apar până la 6 sugestii pe care se poate da click:
  - termeni apropiați ca scriere din titlurile anunțurilor active (potrivire fuzzy, insensibilă la diacritice — ex. „cort” → „corturi”, „cortina”);
  - dacă nu există nimic apropiat, se afișează cele mai populare categorii/căutări ca alternativă.
- Aceeași stare goală se folosește și în modul grid/listă, ca să fie consistent.

## Detalii tehnice

- `src/pages/Search.tsx`: `viewMode` devine `"map" | "gallery" | "list"` (implicit `map`, citit/scris în `?view=`), se randează `CategoryMapView` cu `filteredProducts` când e activ modul hartă, cu layout full-bleed ca în `CategoryDetail`.
- `src/pages/CategoryDetail.tsx`: în `productFilters`, `filters.category` se setează doar când `searchQuery` e gol; se adaugă un state `restrictToCategory` (implicit `false`) comandat de butonul „Caută doar în {categorie}”, plus banda de context deasupra rezultatelor.
- `src/components/category/map/CategoryMapView.tsx`: primește prop-uri noi `searchQuery?: string`, `onClearSearch?: () => void`, `suggestions?: string[]`, `onSuggestionClick?: (term: string) => void`; când `products.length === 0` afișează noul component de stare goală în panoul de listă, păstrând harta randată.
- Component nou `src/components/category/map/MapEmptyState.tsx` pentru mesaj + chips de sugestii.
- Sugestii: hook nou `src/hooks/queries/useSearchSuggestions.ts` care ia titlurile anunțurilor active (RPC `search_products` fără `_search`, cache 5 min) și le scorează client-side cu normalizare de diacritice + distanță Levenshtein/prefix; reutilizează `expandSearchTerms` din `src/lib/searchSynonyms.ts` pentru sinonime.
- Nu se modifică `get_products_map_points` sau alt cod de backend — harta primește exact lista de produse deja filtrată, deci pinurile urmează automat cuvântul cheie.
- SEO: variantele cu `?q=` rămân `noindex`, ca acum; se adaugă `?view=` la aceeași regulă pe `/cauta`.

## Verificare

Se testează în preview cu Playwright: căutare „cort” pe `/cauta` în mod hartă (pinuri doar pentru corturi), căutare „laptop” dintr-o categorie de camping (rezultate din toate categoriile + banda de context), și un termen inexistent („qwertyz”) pentru mesajul cu sugestii.
