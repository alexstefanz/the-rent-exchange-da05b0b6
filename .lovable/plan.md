Înlocuim dropdown-ul unic "Toate orașele" cu două dropdown-uri dependente: **Județ** și **Localitate** (populat din județul ales). Aplicăm în filtrele desktop (`InlineSearchFilters`) și în sheet-ul mobil (`SearchFiltersContent`). Pe pagina de categorie mutăm cele două dropdown-uri în stânga, lângă "X rezultate găsite".

### 1. `src/components/search/SearchFilters.tsx`
- Extindem props: `selectedJudet`, `onJudetChange` (în plus față de `selectedCity`/`onCityChange`).
- Eliminăm `sortedCities` global; calculăm `localitatiOptions` din `judete.find(j => j.name === selectedJudet)?.localitati ?? []`.
- **Județ select** — opțiuni: "Toate județele" + lista `judete`.
- **Localitate select** — opțiuni: "Toate localitățile" + localitățile județului ales. Dezactivat (`disabled`) când `selectedJudet === "all"`.
- Când utilizatorul schimbă județul, dacă există `selectedCity` care nu mai aparține județului, apelăm `onCityChange("all")` (gestionat în pagină via `handleJudetChange`).
- Aplicăm aceeași structură atât în `SearchFiltersContent` (sheet mobil), cât și în `InlineSearchFilters` (desktop).

### 2. `src/pages/CategoryDetail.tsx`
- State nou: `selectedJudet` din `?judet=`; handler `handleJudetChange` (setează județul, scrie `judet` în URL, dacă noua localitate nu e în județ → resetează `selectedCity` și șterge `localitate`).
- `productFilters`: dacă `selectedCity !== "all"` → `location_city = selectedCity`; altfel dacă `selectedJudet !== "all"` → filtrare client-side în `filteredProducts` (`judet.localitati.includes(p.location_city)`).
- `hasActiveFilters` include și `selectedJudet`.
- `handleClearFilters` resetează și județul, șterge `judet` din URL.
- **Layout**: în rândul de sub search bar, mutăm Județ + Localitate (component nou inline simplu cu două `Select`-uri) în **stânga**, înlocuind textul "X rezultate găsite". Mutăm contorul de rezultate deasupra grid-ului. În dreapta rămân: butonul de filtre avansate (preț/sort) + view toggle. `InlineSearchFilters` va primi un prop opțional `hideLocation` ca să nu mai dubleze cele două dropdown-uri de locație în bara din dreapta.

### 3. `src/pages/Search.tsx`
- Înlocuim parametrul existent `judet` (folosit acum doar ca fallback peste `location_city`) pentru a se sincroniza cu noul `selectedJudet`/`selectedCity` din `SearchFilters`. Filtrul `productFilters`: city dacă selectat, altfel județul filtrează client-side prin `judete[].localitati`. Restul UI rămâne neschimbat.

### Note tehnice
- Sursa de adevăr: `src/data/romaniaLocations.ts` (`judete[]` cu `localitati`).
- Backend-ul nu are coloană `location_judet`, deci filtrarea pe județ se face client-side (set de localități).
- URL params: `judet`, `localitate`.
