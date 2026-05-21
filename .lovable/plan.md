## Plan

Cauza: RNT-000053 are status `active` în DB, dar timeline-ul îl afișează „Finalizat" pentru că ambele semnături PV de retur sunt prezente (`rental_pv_documents.phase='return'`, owner_signed_at și renter_signed_at). Tranziția în `status='completed'` se face server-side doar prin `confirmReturn`, care capturează plata — deci o închiriere poate rămâne `active` deși vizual e „Finalizat".

Voi alinia logica de „istoric" cu timeline-ul: o închiriere e considerată finalizată dacă:
- `status` ∈ {`completed`, `cancelled`, `rejected`}, SAU
- ambele semnături din PV-ul de retur există (echivalentul pasului 6 „Finalizat" din timeline).

### Modificări

1. **`src/components/dashboard/RentalsTab.tsx`** (chiriaș)
   - Extind `fetchMyRentals` cu un al doilea query către `rental_pv_documents` filtrat pe `phase='return'` și rental_id-urile încărcate, ca să adaug pe fiecare `MyRental` câmpurile `return_pv_owner_signed_at` și `return_pv_renter_signed_at`.
   - `isFinalized(r)` = status finalizat SAU ambele semnături retur prezente.
   - `isPremium = !isFinalized`. `historyRentals = filtered.filter(isFinalized)`.

2. **`src/components/dashboard/RentalsOutTab.tsx`** (proprietar)
   - Aceeași abordare: în `getOwnerRentals` (sau imediat după apel, în componentă) adaug un fetch suplimentar din `rental_pv_documents` pentru rental_id-urile primite, pentru `phase='return'`.
   - Atașez flag-urile pe fiecare `OwnerRental` (extind interface-ul cu câmpuri opționale).
   - Aplic exact aceeași regulă `isFinalized` pentru a separa `pendingRentals` / `premiumActiveRentals` de `historyRentals`.

3. **Realtime**: hook-ul `useRentalRealtime` deja invalidează lista la schimbări pe `rentals`. Pentru a reflecta și semnarea PV-ului de retur fără refresh, voi invalida lista și când se actualizează `rental_pv_documents` — verific dacă hook-ul ascultă deja această tabelă; dacă nu, adaug un canal local în cele două tab-uri.

### Notă
Nu modific backend-ul (status `completed` se setează tot prin `confirmReturn` la capturarea plății). Schimbarea e strict UI: mut rezervările „Finalizat" din lista activă în dropdown-ul „Istoric închirieri".
