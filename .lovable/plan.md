## Goal

Recunoaște prescurtări și sinonime în căutare astfel încât "TV" să găsească "Televizor OLED", "frigi" → "Frigider", "PS5" → "PlayStation 5", "bici" → "Bicicletă", etc. Acoperă atât dropdown-ul live (`SmartSearch` pe homepage) cât și pagina `/cauta`.

## Approach

Hybrid: dicționar de sinonime gestionat în cod (rapid, fără cost de DB) + extindere ușoară a RPC-ului existent ca să accepte mai mulți termeni OR-uniți.

### 1. Dicționar de sinonime — `src/lib/searchSynonyms.ts` (nou)

Un dicționar bidirecțional curat, focusat pe cele mai comune categorii de pe Rentli (RO + EN + abrevieri):

```ts
const SYNONYM_GROUPS: string[][] = [
  ["tv", "televizor", "televizoare", "smart tv", "oled", "qled"],
  ["bici", "bike", "bicicleta", "bicicletă", "biciclete", "mtb"],
  ["ps", "ps4", "ps5", "playstation", "consola", "consolă"],
  ["xbox", "xbox series", "consola xbox"],
  ["frigi", "frigider", "combina frigorifica", "combină frigorifică"],
  ["masina spalat", "mașină spălat", "masina de spalat", "spălătorie"],
  ["aspi", "aspirator", "vacuum"],
  ["foto", "aparat foto", "camera foto", "dslr", "mirrorless"],
  ["video", "camera video", "camcorder", "gopro"],
  ["drona", "dronă", "drone", "uav", "quadcopter"],
  ["boxa", "boxă", "boxe", "speaker", "difuzor", "soundbar"],
  ["laptop", "notebook", "macbook", "ultrabook"],
  ["tableta", "tabletă", "ipad", "tablet"],
  ["telefon", "smartphone", "iphone", "mobil"],
  ["proiector", "videoproiector", "projector"],
  ["cort", "tent", "camping"],
  ["rulota", "rulotă", "caravan", "trailer"],
  ["scula", "sculă", "unealtă", "tool", "drujba", "drujbă", "bormasina", "bormașină", "polizor"],
  ["masina tuns", "masina de tuns", "trimmer", "motocoasa", "motocoasă"],
  ["generator", "agregat curent"],
  // ... open list, easy to extend
];
```

Funcție exportată `expandSearchTerms(query: string): string[]`:

1. Normalizează query-ul (diacritice scoase, lowercase).
2. Pentru fiecare grup: dacă orice variantă apare ca substring în query, adaugă **toate** variantele grupului în lista returnată.
3. Întoarce `[query, ...synonymsUnique]` cu max ~10 termeni (limită de siguranță).

Exemplu: `expandSearchTerms("tv samsung")` → `["tv samsung", "tv", "televizor", "televizoare", "smart tv", "oled", "qled"]`.

### 2. Update RPC `search_products` — termeni multipli

Migrare nouă (nu editez pe cea veche). Schimbări:

- Adaug parametru opțional `_search_terms text[] DEFAULT NULL`.
- Dacă e prezent, condiția de filtrare devine: orice termen din array match-uiește (ILIKE) titlul SAU descrierea (după unaccent+lower).
- Păstrez `_search` pentru backward-compat — dacă vine `_search` și nu `_search_terms`, comportament identic cu acum.

Schiță SQL:
```sql
AND (
  (_search_terms IS NULL AND _search IS NULL)
  OR (_search IS NOT NULL AND <ILIKE pe _search ca acum>)
  OR (_search_terms IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(_search_terms) AS term
    WHERE public.immutable_unaccent(lower(p.title)) LIKE
          ('%' || public.immutable_unaccent(lower(term)) || '%')
       OR public.immutable_unaccent(lower(coalesce(p.description,''))) LIKE
          ('%' || public.immutable_unaccent(lower(term)) || '%')
  ))
)
```

Indexurile trigram existente acoperă automat `LIKE '%...%'` deci performanța rămâne bună.

### 3. Wire-up client

**`src/features/products/productsApi.ts`**
- După `sanitizeSearchInput`, dacă search-ul are minim 2 caractere, rulez `expandSearchTerms` și pasez ca `_search_terms`.
- Trec `_search: null` când `_search_terms` are mai mult de un termen, ca să folosim noul branch.

**`src/components/home/SmartSearch.tsx`**
- Înlocuiesc `.ilike("title", '%' + probe + '%')` cu `.or(terms.map(t => 'title.ilike.%' + t + '%').join(','))` peste termenii expandați.
- Limit 6 sugestii, deduplicate după `id`.

### 4. Mic UX hint (opțional dar util)

În dropdown-ul `SmartSearch`, când expansiunea adaugă sinonime, afișez un mic chip:
"Caut și după: televizor, smart tv" — text alb pe blur dark, identic cu hint-ul de locație existent.

## Out of scope

- Fără full-text search Postgres (`tsvector`/`tsquery`) — overkill pentru volumul curent și am deja indexuri trigram.
- Fără admin UI pentru editat sinonime (deocamdată e gestionat în cod). Pot adăuga ulterior tabelă `search_synonyms` dacă userul vrea.
- Fără modificări la `Search.tsx` UI sau filtre.

## Files

- `src/lib/searchSynonyms.ts` — nou.
- `src/features/products/productsApi.ts` — apel RPC cu `_search_terms`.
- `src/components/home/SmartSearch.tsx` — sugestii live cu OR pe sinonime + hint.
- `supabase/migrations/<timestamp>_search_products_synonyms.sql` — RPC extins cu parametrul nou.

## Technical notes

- Normalizare consistentă: `s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()`.
- Match case-insensitive și diacritic-insensitive deja garantat de `immutable_unaccent` în RPC.
- Lista de sinonime e ușor de extins — un singur fișier, un singur format.
