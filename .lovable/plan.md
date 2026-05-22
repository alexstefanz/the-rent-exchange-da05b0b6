## Obiectiv
Adaugă un fallback (—) și un loading skeleton pentru secțiunea de statistici de pe profilul public al utilizatorului (`/utilizator/:id`).

## Problema actuală
În `UserProfile.tsx`, secțiunea de statistici este condiționată de `{statistics && (...)}`. Când datele se încarcă, secțiunea dispare complet — utilizatorul nu vede nimic și nu știe că datele vin. De asemenea, când unele valori lipsesc, apar "N/A" sau numărul 0.

## Modificări propuse

### 1. `src/pages/UserProfile.tsx`
- Extrage `isLoading: statsLoading` din hook-ul `useUserStatistics(id)`.
- Înlocuiește condiția `{statistics && (...)}` cu:
  - Dacă `statsLoading === true`: afișează un skeleton format din 4 elemente pulsante (icon + 2 rânduri de text skeleton, grid `grid-cols-2 md:grid-cols-4`).
  - Dacă `statistics` există: afișează valorile reale, dar cu fallback `"—"` pentru orice valoare lipsă (înlocuiește `"N/A"` și afișează `"—"` când `products_count === 0`, `reviews_count === 0`, `average_rating === 0`, `member_since` este null).
- Fallback "—" aplicat consistent pe toate cele 4 statistici: Produse, Rating mediu, Recenzii, Membru din.

### 2. `src/components/product/OwnerTrustCard.tsx` (opțional, dacă e timp)
- Adaugă un mic skeleton în interior când `isLoading` prop este true — avatar skeleton + 3 linii de text skeleton.

## Fișiere modificate
- `src/pages/UserProfile.tsx`
- `src/components/product/OwnerTrustCard.tsx` (opțional)

## Nu se modifică
- Logica de backend, API-uri, sau autentificare.