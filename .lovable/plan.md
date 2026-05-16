## Obiectiv
Adăugarea unui filtru nou „În derulare" în bara de filtrare a paginilor `/rezervari` (chiriaș) și `/cereri-primite` (proprietar), care arată rezervările aflate între plata confirmată și finalizare (returnare confirmată).

## Definiție „În derulare"
O rezervare e „în derulare" dacă:
- `status` ∈ {`confirmed`, `active`}
- `payment_status` = `authorized` sau `captured` (plată făcută)
- `handover_confirmed_at IS NOT NULL` (produsul a fost predat)
- `return_confirmed_at IS NULL` (încă nu s-a finalizat returnarea)

Filtrul „Active" existent rămâne, dar va însemna „confirmate + plătite, înainte de predare" (adică: confirmate dar `handover_confirmed_at IS NULL`), pentru a evita suprapunerea cu noul filtru.

## Modificări

### 1. `src/components/dashboard/RentalsFilterBar.tsx`
- Extinde `RentalStatusFilter` cu `"in_progress"`.
- Adaugă `in_progress: number` în `Counts`.
- Adaugă item nou în lista de filtre: `{ key: "in_progress", label: "În derulare", count: counts.in_progress }`, plasat între „Active" și „În așteptare".

### 2. `src/components/dashboard/RentalsTab.tsx` (chiriaș)
- În `counts`, calculează:
  - `active`: confirmed/active && !handover_confirmed_at (înainte de predare)
  - `in_progress`: (confirmed/active) && handover_confirmed_at && !return_confirmed_at
- În `matchesStatus`, adaugă ramură pentru `"in_progress"`.

### 3. `src/components/dashboard/RentalsOutTab.tsx` (proprietar)
- Aceleași actualizări pentru `counts` și `matchesStatus`.

## În afara scopului
- Nu se schimbă logica `isPremium` / `premiumActiveRentals` (cardurile vizuale rămân așa cum sunt acum — cererile în derulare sunt deja afișate ca premium după fix-ul anterior).
- Nu se schimbă sortarea sau alte filtre.
