## Obiectiv
Pe `/categorie/:slug` mut secțiunile **„Trending în categorie"** și **„Aproape de tine"** sub grila principală de produse, ca slidere cu **2 carduri vizibile pe rând** (în loc de 4), păstrând „Adăugate recent" în poziția curentă (de sus).

## Modificări

### 1. `src/components/category/DiscoveryRails.tsx`
- Adaug prop nou `variant?: "top" | "bottom"` și `slidesPerView?: 2 | 4` pe `Rail`.
- `Rail` cu `slidesPerView={2}` folosește `basis-[80%] sm:basis-[48%] md:basis-[48%] lg:basis-[48%]` → 2 carduri/rând pe desktop, 1 pe mobil.
- Refactor `DiscoveryRails`: împart în două componente exportate, `DiscoveryRailsTop` (doar „Adăugate recent") și `DiscoveryRailsBottom` (Trending + Aproape de tine, cu 2/rând).

### 2. `src/pages/CategoryDetail.tsx`
- Înlocuiesc `<DiscoveryRails ...>` (linia 232) cu `<DiscoveryRailsTop newArrivals={newArrivals} />`.
- După grila principală de produse (după blocul `Load more`, linia ~301), adaug `<DiscoveryRailsBottom trending={trending} nearby={nearby} />` — vizibil doar când `!hasActiveFilters && !isLoading && products.length > 0`.

## În afara scope-ului
- Logica de calcul a listelor (`trending`, `nearby`, `newArrivals`) rămâne neatinsă.
- Stilul cardurilor și restul paginii rămân identice.
