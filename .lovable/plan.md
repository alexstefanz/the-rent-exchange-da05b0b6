
## Scop

Adăugăm un flux de **Anulare comandă cu acord mutual** pe pagina inchirierii (`/rezervari/RNT-XXXXXX`), disponibil până când proprietarul semnează PV de predare. Una din părți inițiază cu un motiv, cealaltă aprobă (sau refuză), iar la aprobare se face refund 100% către chiriaș (inclusiv comisionul) și rezervarea trece în `cancelled`.

Acest flux este complementar față de anularea automată existentă (`cancel-rental-by-renter`, care aplică tier FREE/LIMITED) — nu o înlocuim. Diferența:
- **Anulare automată existentă**: doar chiriașul, înainte de start, refund parțial când e <24h.
- **Anulare cu acord mutual nou**: oricare parte, oricând până la PV predare semnat de proprietar, refund 100% (cu acordul celeilalte părți).

## Schema DB

Migrație nouă — coloane pe `rentals`:
- `cancel_request_status` text — `null | 'pending' | 'approved' | 'rejected'`
- `cancel_request_initiator` uuid — userul care a inițiat
- `cancel_request_reason` text
- `cancel_request_created_at` timestamptz
- `cancel_request_responded_at` timestamptz
- `cancel_request_response_note` text

Helper RPC `request_mutual_cancellation(_rental_id, _reason)` și `respond_mutual_cancellation(_rental_id, _action, _note)` cu `SECURITY DEFINER`, validând:
- userul este `renter_id` sau `owner_id`,
- nu există deja un request `pending`,
- `handover_pv_owner_signed_at IS NULL` (cutoff),
- pentru `respond`: actorul ≠ `cancel_request_initiator`.

## Edge function

Nouă `mutual-cancel-rental` (apelată după ce RPC-ul `respond_mutual_cancellation` setează `approved`):
- voidează PaymentIntent dacă `payment_status='authorized'` sau face refund full dacă `'captured'/'paid'`,
- setează `rentals.status='cancelled'`, `payment_status='refunded'/'voided'`, `cancelled_at=now()`, `rejection_reason = 'Anulare aprobată mutual: ' || reason`,
- inserează tranzacție de tip `refund` pentru istoric,
- trimite notificări la ambele părți (`mutual_cancel_approved`) prin `notify-rental-event`.

Adăugăm și două event-keys noi în `notify-rental-event`:
- `mutual_cancel_requested` → notifică cealaltă parte cu link `/rezervari/{public_id}`,
- `mutual_cancel_approved` / `mutual_cancel_rejected` → notifică inițiatorul.

## UI pe RentalDetailPage

Card nou „Anulare comandă" sub Sumar financiar, vizibil pentru ambele părți **doar dacă** `rental.status` ∈ {`confirmed`, `active`} (sau `pending`) ȘI `handover_pv_owner_signed_at IS NULL` ȘI nu este deja `cancelled/completed/rejected`.

Trei stări vizuale:

1. **Fără request** — buton secundar „Solicită anulare comandă". Click deschide `AlertDialog` cu `Textarea` motiv (min. 10 caractere) + checkbox „Înțeleg că este nevoie de aprobarea celeilalte părți". Submit → RPC `request_mutual_cancellation` + `notify-rental-event`.

2. **Request `pending`, eu sunt inițiator** — card galben „În așteptarea răspunsului ({counterparty})", afișează motivul, buton „Retrage solicitarea" (RPC ce setează `rejected` cu notă „retras de inițiator").

3. **Request `pending`, eu sunt destinatar** — card portocaliu „{Cealaltă parte} a solicitat anularea", afișează motivul, două butoane:
   - „Aprobă anularea" → confirm dialog → RPC `respond_mutual_cancellation('approve')` → invocă `mutual-cancel-rental` → toast + refresh.
   - „Refuză" → dialog cu motiv → RPC `respond_mutual_cancellation('reject', note)`.

După `approved` cardul se ascunde (rezervarea e deja `cancelled` și se afișează block-ul existent „Cerere refuzată/anulată" cu motivul).

Fișiere:
- nou `src/components/rentals/MutualCancellationCard.tsx`
- update `src/pages/RentalDetailPage.tsx` — montare card + props, refetch după acțiune
- update `src/features/rentals/rentalDetailPageApi.ts` — selectează noile coloane
- update `src/features/rentals/rentalsApi.ts` — `requestMutualCancel`, `respondMutualCancel`

## Out of scope

- Comportamentul anulării automate existente rămâne neschimbat.
- Niciun flux nou de email/SMS în plus față de event-keys de mai sus (folosesc infrastructura `notify-rental-event` existentă).
- UI în `RentalsOutTab` / `RentalsInTab`: doar badge minor „Anulare în așteptare" dacă există loc liber, altfel skip.
