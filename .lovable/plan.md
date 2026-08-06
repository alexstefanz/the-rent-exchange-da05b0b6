# Vizualizare Hartă (arie de proximitate) în pagina de categorie

Adăugăm un al treilea mod de vizualizare — **Hartă** — lângă Grid și Listă pe `/categorie/:slug`, setat implicit ca prim mod. Layout în stil Airbnb: listă de anunțuri în stânga, hartă interactivă în dreapta.

## Ce vede utilizatorul

- Comutator cu 3 opțiuni: **Hartă** (implicit) · Grid · Listă. Alegerea se reține în URL (`?view=`) și în localStorage.
- Desktop: listă scrollabilă (stânga, ~55%) + hartă sticky pe toată înălțimea ecranului (dreapta).
- Mobil: harta pe tot ecranul cu un card-carusel jos + buton de comutare „Listă / Hartă".
- Pe hartă apar **pastile cu prețul** (ex. „45 RON") în loc de pini clasici, ca la Airbnb. Hover pe un card din listă evidențiază pastila corespondentă și invers.
- Poziția este **aproximativă** (cerc de proximitate ~700 m, coordonate rotunjite/jitter stabil per anunț). Adresa exactă rămâne privată până la rezervare.
- Anunțurile fără pin propriu sunt plasate în centrul localității declarate.
- Clusterizare când sunt multe anunțuri apropiate; buton „Caută în această zonă" la mutarea hărții, care filtrează lista după viewport.
- Lista rămâne sincronizată cu filtrele existente (subcategorie, județ/localitate, preț, sortare).

## Click pe un anunț

Se deschide un **panou lateral peste listă** (harta rămâne vizibilă):
- sus, cardul mare al anunțului selectat (galerie foto, titlu, preț/zi, oraș, rating, buton „Vezi anunțul");
- dedesubt, „Anunțuri similare în apropiere" — aceeași categorie, sortate după distanța față de anunțul selectat;
- harta face zoom/centrare pe anunț, iar pastila devine activă; buton „Înapoi la rezultate".
- Pe mobil, același conținut apare într-un bottom-sheet care poate fi tras în sus.

## Detalii tehnice

**Hartă:** conector Google Maps (Lovable-managed). Se leagă prin connect, apoi Maps JS API se încarcă cu `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, `loading=async` + callback, marker-e clasice `google.maps.Marker` cu iconițe HTML personalizate (fără `mapId`).
Notă: cheia managed este restricționată la domenii `*.lovable.app`. Pentru **rentli.ro** va fi nevoie de o cheie proprie din Google Cloud (proiect cu billing + Maps JavaScript API) legată ca o conexiune nouă — pot ghida pas cu pas când ajungem acolo.

**Coordonate (backend):**
- RPC nou `get_products_map_points(_category, _subcategory, _location_city, _search)` (SECURITY DEFINER, GRANT către `anon` + `authenticated`) care returnează pentru anunțurile active/aprobate: `id, slug, title, title_en, daily_price_owner, images[0], location_city, approx_lat, approx_lng, has_precise`.
- `approx_lat/lng` = `pickup_lat/lng` rotunjite la ~3 zecimale plus un offset determinist derivat din `id` (rază ≤ ~700 m). Coordonatele exacte NU sunt expuse — column-level grants pe `pickup_lat/lng` rămân neschimbate.
- Fallback: dacă lipsesc `pickup_lat/lng`, se folosește centrul localității dintr-o tabelă nouă `ro_city_coords (city, judet, lat, lng)` populată prin migrare pentru localitățile din `src/data/romaniaLocations.ts` (SELECT public).

**Frontend:**
- `src/components/category/MapView.tsx` (harta + markere preț + clustering + „caută în zonă"), `MapListPanel.tsx` (listă sincronizată), `MapDetailPanel.tsx` (anunț principal + similare), `PriceMarker.tsx`.
- Hook nou `src/hooks/queries/useProductsMapPoints.ts` peste RPC-ul de mai sus.
- `src/pages/CategoryDetail.tsx`: `viewMode` devine `"map" | "gallery" | "list"` cu `"map"` implicit; filtrele și `hasActiveFilters` rămân neschimbate.
- Similaritatea = aceeași categorie/subcategorie, sortate după distanță haversine față de anunțul selectat.
- Fără date noi de business: prețurile și filtrele folosesc logica existentă (`calculateClientPrice`).
