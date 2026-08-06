# Migrare de la Google Maps la Mapbox pentru domeniul custom

## Obiectiv
Înlocuirea completă a Google Maps Platform cu Mapbox pentru componenta de hartă din pagina de categorie, astfel încât harta să funcționeze corect pe `rentli.ro` / `www.rentli.ro` fără abonament Google Cloud.

## Starea actuală (confirmată)
- Google Maps este folosit doar în **componenta de hartă a paginii de categorie** (`/categorie/:slug`).
- Fișierele afectate sunt:
  - `src/hooks/useGoogleMaps.ts` — încarcă script-ul Google Maps
  - `src/components/category/map/MapCanvas.tsx` — randează harta și markerele
  - `src/components/category/map/priceMarker.ts` — generează pill-uri SVG pentru preț și clustere
- Nu există utilizare server-side a Google Maps în edge functions sau alte pagini.

## Soluție propusă: Mapbox
Mapbox este disponibil ca connector în workspace și are un plan gratuit generos (până la 50.000 de încărcări de hartă pe lună în planul free). Va trebui să creezi un cont Mapbox și să generezi un **Public Token** (pentru browser) și, opțional, un **Secret Token** (doar dacă vrei geocoding server-side; pentru harta actuală nu este necesar).

**Important:** termenii Google Maps interzic folosirea Google Maps Platform și Mapbox în același proiect. Prin urmare, conexiunea Google Maps Platform va fi deconectată după migrare.

## Pași de implementare

1. **Pregătire cont Mapbox**
   - Creezi un cont gratuit pe mapbox.com.
   - Generezi un **Public Access Token** (`pk.`).
   - Restricționezi public token la domeniile tale: `https://rentli.ro/*`, `https://www.rentli.ro/*`.

2. **Deconectare Google Maps Platform**
   - Deconectez conexiunea Google Maps Platform din proiect pentru a respecta termenii de utilizare.

3. **Conectare Mapbox**
   - Conectez connectorul Mapbox la proiect cu public token-ul generat de tine.
   - Acesta va crea variabila de mediu `VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN` pentru frontend.

4. **Adăugare dependință**
   - Instalez `mapbox-gl` și `@types/mapbox-gl` ca dependințe npm.

5. **Înlocuire hook de încărcare hartă**
   - Creez `src/hooks/useMapbox.ts` care inițializează Mapbox GL JS cu public token și așteaptă ready state.
   - Șterg `src/hooks/useGoogleMaps.ts`.

6. **Rescriere MapCanvas pentru Mapbox**
   - Refac `src/components/category/map/MapCanvas.tsx` pentru a folosi `mapboxgl.Map` în loc de `google.maps.Map`.
   - Păstrez același comportament: centru pe România, fit bounds, pan to selection, buton „Caută în această zonă", clustering, hover/select states.
   - Stilul hărții va fi un stil Mapbox desaturat, similar cu look-ul Airbnb actual.

7. **Adaptare markere**
   - Reutilizez `priceMarker.ts` pentru a genera pill-uri SVG; le integrez ca markere Mapbox (`new mapboxgl.Marker({ element: ... })`) sau ca `mapboxgl.Marker` cu icon URL.
   - Păstrez design-ul actual: pill alb cu preț, negru când este activ, cluster alb cu număr.

8. **Testare**
   - Verific harta în modul desktop (split 58/42).
   - Verific harta în modul mobil/tabletă (hartă sus, listă jos, 2 coloane pe rând).
   - Verific click pe marker, paginare, selectare anunț și butonul „Caută în această zonă".

9. **Curățare**
   - Elimin referințele rămase la Google Maps din `.env` și cod.

## Ce nu se schimbă
- `CategoryMapView.tsx`, `MapDetailPanel.tsx`, `MapProductCard.tsx` rămân neschimbate în structură și comportament; doar componenta de randare a hărții este înlocuită.
- RPC-ul `get_products_map_points` și datele de locație rămân aceleași.

## Trade-off-uri
- Mapbox free tier acoperă traficul mediu, dar depășirea limitelor va genera costuri.
- Stilul hărții va fi Mapbox, nu Google Maps; vom aproxima look-ul desaturat Airbnb.
- Nu mai poți folosi Google Maps Platform în același proiect.

## Acceptare
Dacă ești de acord cu migrarea la Mapbox, aprobă planul și îmi spui când ai public token-ul Mapbox gata pentru conectare.
