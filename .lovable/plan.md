## Obiectiv

Schimbăm fluxul de checkout astfel încât:
1. **Chiriașul trimite cererea** (fără card, fără Stripe) → rental cu `status=pending`, `payment_status=pending`.
2. **Proprietarul acceptă/refuză** din panoul lui.
3. **DOAR după acceptare** chiriașul primește notificare (in-app + email + SMS) cu CTA "Plătește acum" și este dus la Stripe Checkout. Plata reală (autorizare/hold) se întâmplă aici.
4. Dacă proprietarul refuză sau expiră fereastra → niciun ban nu a fost reținut, nimic de refundat.

Asta aliniază UI-ul cu noul timeline pe 7 pași (Cerere → Confirmat → Plată → ...).

## Modificări UI (frontend)

### `src/pages/Checkout.tsx`
- Pas 2 nu mai este "Plătește cu cardul", devine "Trimite cererea".
- Butonul principal apelează o nouă funcție `createRentalRequest` (fără Stripe) și redirectează către `/rezervari/{public_id}` (sau `/rezervari` cu toast).
- KYC gate rămâne (verificarea identității este necesară pentru a putea trimite cerere).
- Modul TEST admin rămâne separat (păstrăm `createRentalWithStripeTestCheckout` pentru QA admin).
- Trust strip + copy actualizate: "Cardul tău nu este debitat acum. Plătești doar după ce proprietarul confirmă."

### `src/features/rentals/rentalsApi.ts`
- Funcția nouă `createRentalRequest(params)` — folosește `createRental` existent + creează imediat conversația și mesajul către owner (mutate aici din `verify-stripe-payment`).
- `createRentalWithStripeCheckout` rămâne, dar va fi apelat doar pentru rental-uri deja `confirmed` care n-au plătit încă (vezi mai jos).

### `src/pages/RentalDetailPage.tsx` + carduri în `RentalsPage.tsx`
- Când `status=confirmed && payment_status=pending` și user-ul curent este chiriaș → afișează card mare "Proprietarul a acceptat – plătește acum pentru a confirma rezervarea" cu buton "Plătește" (și termen-limită opțional).
- Click pe "Plătește" apelează `payForConfirmedRental(rentalId)` → noul edge function returnează URL Stripe Checkout.

### `src/components/dashboard/RentalsTab.tsx` / `RentalsOutTab.tsx`
- Buton suplimentar "Plătește" pe rândul de rental-uri în starea de mai sus (renter view).

## Modificări backend (edge functions + DB)

### `respond-rental-request` (existent)
- La `accept`: se eliberează deja Stripe-ul existent ca fallback (păstrăm), dar adăugăm un câmp nou de notificare:
  - Notificarea in-app către chiriaș are `link=/rezervari/{public_id}` și mesaj "Plătește acum pentru a-ți rezerva produsul".
  - În `notify-rental-event` event_key `request_accepted` → SMS + email obține CTA "Plătește": `https://rentli.ro/rezervari/{public_id}` (template e-mail actualizat să includă butonul Plătește dacă `payment_status=pending`).

### `create-checkout-session` (existent)
- Validare actualizată: acceptă rental dacă `status IN ('pending','confirmed')` și `payment_status='pending'`. Dacă `status='confirmed'` → check că user-ul este `renter_id`.
- Restul rămâne neschimbat (creează PaymentIntent cu `capture_method=manual` pentru hold).

### `verify-stripe-payment` (existent)
- Dacă rental era `confirmed` la intrare: setează `payment_status='authorized'`, dar **nu** mai schimbă `status` (rămâne `confirmed`).
- Dacă rental era `pending` (cazul vechi, payment-first, lăsat ca fallback pentru compatibilitate): comportament actual — îl mutăm pe ramura "legacy".
- Mutăm crearea conversației + mesajului owner în `createRentalRequest` (pe client) ca să se întâmple imediat când chiriașul trimite cererea, nu după plată. În `verify-stripe-payment` păstrăm doar updatarea `payment_status`.

### Notificări noi (extindere `notify-rental-event`)
- `request_received` (owner) — se trimite acum la `createRentalRequest`, nu după plată. SMS + email + in-app.
- `request_accepted` (renter) — include CTA "Plătește acum".
- `payment_completed` (owner) — rămâne la `verify-stripe-payment`. SMS + email + in-app.

### Cron auto-expiry (opțional, recomandat)
- Edge function nouă (sau extindere `process-rental-captures`) care marchează ca `cancelled` rental-urile `status=confirmed && payment_status=pending` mai vechi de 24h, ca să elibereze calendarul. Nu blochează release-ul curent.

## Timeline (`RentalTimeline.tsx`)
- Logica `getTimelineStep` deja gândită pentru noul flux:
  - `pending && payment_status=pending` → step 1 ✓
  - `confirmed && payment_status=pending` → step 2 (rămâne pe "Confirmat" până la plată) — modificare mică în getTimelineStep ca step 3 să nu se aprindă fără autorizare.
  - `confirmed && payment_status=authorized` → step 3 ✓

## Ordine de implementare

1. Edge function: `respond-rental-request` — adaugă CTA plată în notificări.
2. Edge function: `create-checkout-session` — acceptă și `status=confirmed`.
3. Edge function: `verify-stripe-payment` — bifurcație pe status la intrare.
4. Edge function: `notify-rental-event` — eveniment nou `request_received` declanșat la creare cerere.
5. `rentalsApi.ts` — `createRentalRequest` (fără Stripe) + `payForConfirmedRental` (apelează `create-checkout-session` pentru rental existent).
6. `Checkout.tsx` — schimbă submit-ul + copy-ul.
7. `RentalDetailPage.tsx` + `RentalsTab.tsx` (renter) — card/buton "Plătește acum".
8. `RentalTimeline.tsx` — ajustare mică `getTimelineStep`.
9. (opțional) cron auto-expiry 24h.
10. QA: cerere → owner refuză (no Stripe touch); cerere → owner acceptă → renter plătește → handover.

## Detalii tehnice

- Nu trebuie migrare DB nouă: coloanele `status` + `payment_status` deja acoperă combinația `confirmed + pending`.
- KYC chirias: rămâne necesar la trimiterea cererii (nu doar la plată), ca să nu pierdem owner-ul cu cereri ne-verificate.
- Calendar disponibilitate: rental-urile `pending` și `confirmed` blochează deja datele în `get_booked_dates` (verificat) — nu se modifică.
- Compatibilitate: rental-urile vechi (status=pending && payment_status=authorized/paid) continuă să funcționeze pe legacy path.
