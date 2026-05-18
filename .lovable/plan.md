## Goal
Permite chiriașului să anuleze instant cererea trimisă către proprietar, fără aprobare admin, **dacă plata nu a fost încă efectuată** (`payment_status` ≠ `authorized` / `paid` / `captured`). După ce există un hold/plată activă, fluxul curent (cerere mutuală + admin pentru refund) rămâne neschimbat.

## Backend (migration)

Funcție SQL nouă `public.renter_cancel_unpaid_rental(_rental_id uuid)`:
- `security definer`, `search_path = public`
- Verifică:
  - `auth.uid() = rentals.renter_id`
  - `payment_status` este `NULL` sau `pending` (nicio sumă reținută la Stripe / wallet)
  - `status` ∈ (`pending`, `confirmed`) și `handover_pv_owner_signed_at IS NULL`
  - Nu există deja `cancel_request_status = 'pending'` (sau o resetează)
- Setează: `status = 'cancelled'`, `cancellation_reason = 'renter_self_unpaid'`, `cancelled_at = now()`, `cancel_request_status = NULL` (curăță orice cerere mutuală deschisă).
- Returnează `{ ok: true }`.

Acordă `EXECUTE` rolului `authenticated`.

## API wrapper

În `src/features/rentals/rentalsApi.ts` adaug `renterCancelUnpaidRental(rentalId)`:
- Apelează RPC-ul.
- Post-success: `supabase.functions.invoke("notify-rental-event", { body: { rental_id, event_key: "request_cancelled_by_renter" } })` (best-effort, non-blocking). Reutilizez canalul existent; dacă cheia nu e mapată în edge function, primește fallback generic — voi adăuga o mapare scurtă în `notify-rental-event` doar dacă lipsește (verificare la implementare).

## UI

`src/components/rentals/MutualCancellationCard.tsx`:
- Adaug prop `paymentStatus?: string | null` și `rentalStatus?: string | null`, `isRenter: boolean` (sau derivat din `renterId`).
- Calculez `canRenterSelfCancel = isRenter && (!paymentStatus || paymentStatus === "pending") && rentalStatus !== "cancelled" && !handoverSigned`.
- Când `canRenterSelfCancel` și nu există cerere admin în curs:
  - Înlocuiesc CTA-ul „Solicită anulare" cu un buton direct **„Anulează cererea"** (variant destructive) + un dialog scurt de confirmare (fără subiect/motiv/checkbox).
  - Text explicativ: „Plata nu a fost efectuată — poți anula cererea instant, fără aprobarea unui admin."
- Restul logicii (cerere mutuală + admin) rămâne identică pentru cazurile cu plată activă.

`src/pages/RentalDetailPage.tsx`:
- Pasez `paymentStatus={rental.payment_status}`, `rentalStatus={rental.status}`, `isRenter={user?.id === rental.renter_id}` către `MutualCancellationCard`.

## Notificare (best-effort)

- In-app: trigger-ul existent pe schimbarea `status → cancelled` (dacă există) acoperă cazul; altfel edge function-ul `notify-rental-event` cu cheia nouă trimite email + in-app owner-ului. Verific în implementare și adaug mapping dacă lipsește.

## Out of scope

- Nu modific fluxul de refund / cerere mutuală existent pentru rezervări plătite.
- Nu schimb dashboard-ul admin (nu apare nimic acolo, fiind self-service).
- Nu ating UI-ul proprietarului — el primește doar notificarea standard de „cerere anulată".

## Validation
- Chiriaș cu rental `pending` + `payment_status = pending` → vede butonul „Anulează cererea", confirmă, rental devine `cancelled`, owner primește notificare.
- Chiriaș cu rental `confirmed` + `payment_status = authorized` → vede în continuare fluxul cu cerere admin.
- Owner-ul nu vede butonul nou nici într-un caz.
