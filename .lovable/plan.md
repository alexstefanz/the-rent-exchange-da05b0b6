# Harta funcțională pe rentli.ro

Harta este deja implementată complet (mod Hartă pe categorii + căutare, pastile cu preț, coordonate aproximative din `get_products_map_points`). Singurul lucru care lipsește pentru domeniul propriu este **cheia Google Maps**.

## De ce nu merge acum pe rentli.ro

Aplicația încarcă Google Maps cu cheia managed de Lovable (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, folosită în `src/hooks/useGoogleMaps.ts`). Acea cheie este restricționată la domenii `*.lovable.app`, deci pe `rentli.ro` / `www.rentli.ro` Google refuză cererea și harta rămâne goală sau cu mesaj de eroare.

## Ce îți trebuie (partea ta, în Google Cloud)

1. Proiect Google Cloud cu **facturare activată** (Maps are un credit lunar gratuit, dar cardul este obligatoriu).
2. Activează API-urile: **Maps JavaScript API** (obligatoriu) și, opțional, **Geocoding API** dacă vrem mai târziu adrese → coordonate.
3. Creează o **cheie API de browser** și restricționeaz-o:
   - Application restrictions: HTTP referrers → `https://rentli.ro/*`, `https://www.rentli.ro/*`, `https://*.lovable.app/*` (ca să meargă și preview-ul).
   - API restrictions: doar Maps JavaScript API.
4. Recomandat: setează o **limită de buget / alertă** în Google Cloud, ca protecție de cost.

## Ce fac eu în aplicație

- Adaug cheia ta ca variabilă de mediu proprie (`VITE_GOOGLE_MAPS_BROWSER_KEY`).
- Modific `src/hooks/useGoogleMaps.ts` să folosească cheia proprie când există și să cadă înapoi pe cheia managed Lovable pentru preview.
- Păstrez mesajul de eroare prietenos din `MapCanvas.tsx` dacă cheia lipsește sau e respinsă.
- Verific după publicare că harta se încarcă pe rentli.ro (fără erori „RefererNotAllowedMapError" / „ApiNotActivatedMapError" în consolă).

## Note

- Nu se schimbă nimic la datele de locație: rămân coordonatele aproximative (~700 m) din RPC, adresa exactă rămâne privată până la rezervare.
- Cheia de browser este publică prin natura ei; protecția reală o dau restricțiile de referrer + limitarea la un singur API.
