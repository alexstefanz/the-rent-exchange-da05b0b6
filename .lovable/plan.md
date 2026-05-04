## Obiectiv
1. Când proprietarul acceptă o cerere, notificarea trimisă chiriașului trebuie să ducă **direct la pagina produsului rezervat** (`/produs/{slug}`), nu la `/cereri`.
2. Eliminarea complet a secțiunii "Cereri" din "Contul meu" (deoarece odată acceptate cererile apar deja în Rezervări).

## Modificări

### 1. Edge function `supabase/functions/respond-rental-request/index.ts`
- La pasul în care se preia produsul (`productRes`), se va selecta și `slug` pe lângă `title`.
- Pentru notificarea de acceptare, `link` devine `/produs/{slug}` (fallback `/rezervari` dacă slug lipsește).
- Pentru notificarea de respingere, `link` devine `/rezervari` (request-ul cancelled apare în istoric Rezervări).

### 2. `src/pages/Profile.tsx`
- Șterg item-ul `cereri` din `NAV_ITEMS`.
- Elimin query-ul `pending-requests-count` și logica `badgeCount` corespunzătoare (rămâne doar `inchirieri-out`).
- Grid-ul devine `lg:grid-cols-5`.

### 3. `src/App.tsx`
- Elimin route-ul `/cereri` și import-ul lazy `RequestsPage`.

### 4. `src/pages/RequestsPage.tsx` și `src/components/dashboard/RequestsTab.tsx`
- Șterse (nu mai sunt folosite).

### 5. Maparea notificărilor (link legacy `/cereri?...`)
- `src/components/layout/NotificationBell.tsx` și `src/components/profile/NotificationsTab.tsx`: rescriu mapările care duc la `/cereri` să meargă la `/rezervari` (pentru notificările vechi din DB care încă au link-uri `/cereri?rental_id=...`).

## Note
- Notificările vechi din baza de date păstrează link-ul `/cereri?...`; mapping-ul updatat le redirecționează la `/rezervari` ca să nu apară 404.
- Nu se modifică schema DB.
