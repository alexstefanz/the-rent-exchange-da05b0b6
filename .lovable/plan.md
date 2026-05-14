## Redesign tab "Rezervări" (renter side, /rezervari)

Aplic aceeași structură ca pe `/inchirieri`, adaptată pentru perspectiva chiriașului.

### Fișiere modificate
- `src/components/dashboard/RentalsTab.tsx` (rescriere conform structurii din `RentalsOutTab.tsx`)

### 1. Lărgire query
`fetchMyRentals` se extinde să aducă toate rezervările chiriașului (inclusiv `cancelled`, `rejected`, pending fără plată) — necesare pentru stats + istoric. Câmpuri noi: `owner_id`, `payment_status`, `handover_confirmed_at`, `owner_payout`, `return_confirmed_at`, plus numele proprietarului via join `profiles!owner_id(full_name)`.

### 2. Stats summary (4 carduri)
Grid `grid-cols-2 lg:grid-cols-4`:
- **În așteptare** (`Inbox`) — `status === pending` (așteaptă răspunsul proprietarului)
- **Active** (`Package`) — `confirmed` + `active`
- **Anulate** (`XCircle`, muted) — `cancelled` + `rejected`
- **Cheltuit luna asta** (`TrendingUp`, primary) — sumă `subtotal` pentru rezervări `completed` finalizate luna curentă

### 3. Carduri premium "Rezervările mele" — grid 3 pe rând cu imagine
Wrapper `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`. Conține rezervările `pending` + `confirmed`/`active` fără `handover_confirmed_at`.

Fiecare card:
- Imagine produs `aspect-[16/10]` în partea de sus + badge status suprapus
- "REZERVARE LA / Nume proprietar"
- "pentru [Nume produs]"
- Mini-tile-uri (Perioadă / Zile / Total plătit)
- Buton principal "Vezi detalii" → `/rezervari/{public_id}`
- Buton secundar "Solicită anularea cererii" (folosind `requestMutualCancellation` deja existent), vizibil pentru `confirmed`/`active` fără handover

### 4. Accordion istoric (fără imagini)
Toate celelalte (completed, cancelled, rejected, active cu handover deja confirmat) într-un `<Accordion>` cu listă: nume produs, proprietar, perioadă, total, `StatusBadge`, buton "Vezi mai mult".

### Out of scope
- Fără modificări de business logic
- Fără atingere `RentalProductCard` (nu mai e folosit aici după refactor)
- Pagina `/rezervari/{id}` rămâne cum e
