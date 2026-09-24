# Harta se mută pe zona aleasă, chiar dacă nu există anunțuri acolo

## Răspuns scurt
Da, acum așa funcționează: harta se recentrează doar pe anunțurile găsite. Dacă alegi un județ sau o localitate fără anunțuri, nu are unde să se mute și rămâne pe zona veche. Asta derutează, așa că propun să schimb comportamentul.

## Ce se schimbă
1. Când alegi un județ sau o localitate, harta se mută mereu acolo:
   - dacă există anunțuri, se încadrează pe ele (ca acum);
   - dacă nu există, se centrează pe localitate (zoom de oraș) sau pe județ (zoom de județ).
2. Peste hartă apare un mesaj scurt: „Niciun anunț în această zonă încă”, cu butonul „Șterge filtrele de locație”.
3. Când ștergi filtrele de locație, harta revine la vederea întregii țări sau pe anunțurile rămase.

## Detalii tehnice
- Tabela `ro_city_coords` are acum doar 42 de localități. O completez printr-o migrare cu coordonatele tuturor localităților din `src/data/romaniaLocations.ts` (circa 210). Nu se adaugă date noi de afaceri, doar coordonate publice.
- Hook nou `useLocationFocus(judet, city)`: citește coordonatele localității, iar pentru județ face media localităților lui. Rezultatul se păstrează în cache.
- `CategoryDetail.tsx` trimite `selectedJudet`/`selectedCity` către `CategoryMapView`, care trimite mai departe `focus` și `emptyArea` către `MapCanvas`.
- `MapCanvas.tsx`: când `items.length === 0` și există `focus`, se apelează `setCenter` + `setZoom` (12 pentru oraș, 9 pentru județ). Cheia de încadrare (`fittedRef`) include și focusul, ca harta să nu rămână blocată pe vederea veche. Se afișează suprapunerea „fără anunțuri”.
- Pentru poziționare nu se face niciun apel nou către Google (fără costuri în plus).
