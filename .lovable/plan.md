

## Plan: Timeline vizibil cu 6 pași pentru Cereri/Rezervări

### Concept
Adaug un **timeline orizontal cu 6 pași** vizibil pe cardurile de cerere/rezervare (atât pentru chiriaș, proprietar, cât și pentru admin). Pașii se deblochează automat pe măsură ce statusul se schimbă, cu acțiuni explicite de confirmare la momentele cheie.

### Cei 6 pași și triggerele lor

| # | Pas | Trigger de deblocare |
|---|---|---|
| 1 | **Cerere trimisă** | Rental creat (`status=pending`) |
| 2 | **Cerere aprobată** | Proprietar acceptă **ȘI** plata e autorizată (`status=confirmed` + `payment_status=authorized`). Dacă proprietarul respinge → Stripe refund automat → cerere oprită cu badge "Anulată / Bani returnați" |
| 3 | **În tranzit spre beneficiar** | Activat automat după aprobare. Proprietarul completează "Predare" (inspecție checkout cu poze) → trece la pasul 4 |
| 4 | **Produs în folosire** | După confirmarea predării de către proprietar (`handover_confirmed_at` setat). Status rental devine `active` |
| 5 | **Produs în curs de returnare** | Activat automat în **ultima zi** a rezervării (`end_date = today`). Notificare push + email către chiriaș: "Contactează proprietarul pentru returnare" |
| 6 | **Finalizat** | Proprietar bifează "Confirm returnare OK" → status `completed` → Stripe capture → `owner_payout` transaction devine `available` (apare în balanță) |

### Schimbări de bază de date

**Migrație nouă** — adaug coloane în `rentals`:
- `handover_confirmed_at timestamptz` — când proprietarul a confirmat predarea
- `return_confirmed_at timestamptz` — când proprietarul a confirmat returnarea OK
- `refunded_at timestamptz` — când s-a făcut refund (la respingere după plată)

Statusurile rămân: `pending → confirmed → active → completed | cancelled`. Coloanele noi servesc ca sub-stări vizuale pentru timeline.

### Logică automată

**Refund la respingere**: în `respond-rental-request` — când acțiunea e `reject` și există `payment_intent_id`, apelez `stripe.paymentIntents.cancel()` (pentru fonduri doar autorizate) sau `refunds.create()` (dacă deja capturate). Setez `refunded_at` și `payment_status='refunded'`.

**Confirmare predare** (proprietar): buton nou "Confirmă predarea" pe cardul de rezervare → setează `handover_confirmed_at` + status `active`. Apare doar după ce inspecția checkout există.

**Notificare ultima zi**: Edge function nouă `notify-return-day` rulează zilnic via cron (pg_cron). Pentru fiecare rental cu `status=active` și `end_date=today`, trimite notificare in-app + email chiriașului.

**Confirmare returnare** (proprietar): buton "Confirm returnarea (totul OK)" → setează `return_confirmed_at`, `status=completed`, apelează `capture-rental-payment` pentru rentalul respectiv. Tranzacția `owner_payout` devine vizibilă în balanță.

### Componenta UI — `RentalTimeline`

Componentă nouă `src/components/dashboard/RentalTimeline.tsx`:
- Layout: 6 cercuri conectate prin linii orizontale (responsive: vertical pe mobil)
- Stări vizuale per pas:
  - **Completat**: cerc plin portocaliu (#F59E0B) cu bifă albă
  - **Activ (curent)**: cerc portocaliu cu pulsație, text bold
  - **Blocat (viitor)**: cerc gri deschis cu numărul pasului
  - **Anulat**: cerc roșu cu X (pentru cazul de respingere/refund)
- Sub fiecare cerc: label scurt + timestamp dacă pasul e completat
- Pe mobil: timeline vertical cu liniile pe stânga

```text
●━━━●━━━●━━━○━━━○━━━○
1   2   3   4   5   6
✓   ✓  curent
```

Logica de calcul al pașilor:
```typescript
function getTimelineStep(rental) {
  if (rental.status === 'cancelled') return { current: 2, cancelled: true };
  if (rental.status === 'completed' || rental.return_confirmed_at) return 6;
  if (rental.status === 'active' && isLastDay(rental.end_date)) return 5;
  if (rental.status === 'active' && rental.handover_confirmed_at) return 4;
  if (rental.status === 'confirmed') return 3;
  if (rental.status === 'pending') return 1;
}
```

### Unde apare timeline-ul

1. **`/cereri`** (chiriaș) — pe fiecare card de cerere/rezervare
2. **`/rezervari`** (chiriaș) — pe fiecare card activ + completat
3. **Tab "Închirieri"** din `/profile` (proprietar, în `LendingsTab`) — pe fiecare card de rezervare
4. **`/admin/rezervari`** (admin) — pe rândul expandat al fiecărei rezervări (nou — accordion sau dialog)

### Acțiuni noi pe carduri

**Pentru proprietar** (în `LendingsTab`):
- După `confirmed` + checkout inspection completat → buton "✅ Confirm predarea"
- După `active` + `end_date <= today` + checkin inspection completat → buton "✅ Confirm returnarea (totul OK)"

**Pentru chiriaș** (în `RentalsTab`):
- Pasul 5 activ → mesaj contextual cu CTA "Contactează proprietarul" + reminder vizibil

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| Migrație SQL nouă | Coloane `handover_confirmed_at`, `return_confirmed_at`, `refunded_at` în `rentals` |
| `src/components/dashboard/RentalTimeline.tsx` | **NOU** — componentă timeline reutilizabilă |
| `src/components/dashboard/RequestsTab.tsx` | Adaug `<RentalTimeline />` pe fiecare card |
| `src/components/dashboard/RentalsTab.tsx` | Adaug `<RentalTimeline />` + mesaj contextual pasul 5 |
| `src/components/dashboard/LendingsTab.tsx` | Adaug `<RentalTimeline />` + butoane "Confirm predarea" / "Confirm returnarea" |
| `src/pages/admin/AdminReservations.tsx` | Adaug timeline expandabil în detaliu rezervare |
| `src/features/rentals/rentalsApi.ts` | Funcții `confirmHandover()`, `confirmReturn()` |
| `supabase/functions/respond-rental-request/index.ts` | Logică refund Stripe la respingere (cancel sau refund) |
| `supabase/functions/notify-return-day/index.ts` | **NOU** — edge function cron pentru notificare ultima zi |
| `supabase/functions/capture-rental-payment/index.ts` | Apelat din `confirmReturn` pentru capture la finalizare |
| Migrație SQL — pg_cron | Programează `notify-return-day` zilnic la 09:00 |
| `src/data/uxCopy.ts` | Texte RO/EN pentru cei 6 pași |

### Note importante
- Pe carduri compacte (admin list view), afișez doar pasul curent ca badge + tooltip cu timeline complet la hover/click
- Timeline-ul se actualizează în timp real prin invalidarea queries existente (`my-rentals`, `my-requests`, `ownerRentals`)
- Pentru rezervările deja existente (înainte de migrație), pașii 3+ se deduc din statusul curent — fără date pierdute

