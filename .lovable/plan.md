# Layout mobil — Search & Categorii

## Modificări (`src/pages/CategoryDetail.tsx` și `src/pages/Search.tsx`)

1. **Search input full width** pe rândul lui — scot butonul `<SearchFilters>` (mobile sheet) de lângă input.
2. **Rândul de sub** (cel care conține deja toggle-ul grid/list) devine: 
   - **stânga**: switcher grid/list 
   - **dreapta**: butonul „Filtre" (`<SearchFilters>` mobile sheet)
   
   Realizat cu `flex items-center justify-between` (toggle-ul fără `ml-auto`, butonul Filtre cu `ml-auto` sau plasat direct la final). Pe desktop (`lg:`) butonul Filtre rămâne ascuns (deja are `lg:hidden`), iar `InlineSearchFilters` rămâne în dreapta ca acum.

Nu schimb nimic la desktop. Nu modific componenta `SearchFilters` în sine.
