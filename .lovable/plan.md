## Context

Acum chiriașul poate anula doar cereri **neplătite** (în `RequestsTab`, restricție 24h). După plata cu Stripe (status `pending` + `payment_status` `authorized`/`paid`), cererea apare în `RentalsTab` → secțiunea "În așteptarea proprietarului" și **nu există nicio opțiune de anulare** — banii rămân blocați la Stripe până când proprietarul răspunde.

## Ce facem

Adăugăm buton **"Anulează cererea"** doar pentru cererile plătite aflate în așteptarea proprietarului. Anularea:
- marchează rezervarea `cancelled` (motiv: `renter_cancelled_after_payment`)
- trimite notificare proprietarului că nu mai trebuie să răspundă
- creează automat un **ticket admin (TCK-XXXXXX)** pentru ca echipa să verifice manual și să elibereze hold-ul Stripe / să returneze banii
- afișează utilizatorului un mesaj explicit: *"Cererea a fost anulată. Banii blocați la card vor fi eliberați după verificarea echipei (1–3 zile lucrătoare)."*

NU se face refund automat la Stripe (conform deciziei tale).

## Modificări

### 1. RLS (migrare SQL)
Politica actuală `Renters can cancel own pending rentals` permite `UPDATE` doar când `status = 'pending'`, deci acoperă deja cazul. Verificăm și extindem dacă e nevoie ca să accepte și actualizarea câmpului `cancellation_reason`. Nu se schimbă schema.

### 2. `src/components/dashboard/RentalsTab.tsx`
În cardurile din secțiunea `awaitingOwnerRentals` (status `pending` + plătit):
- Adaug buton outline destructive **"Anulează cererea"** lângă "Contactează proprietarul".
- `AlertDialog` cu textul:
  > *Vei anula această cerere către {owner_name} pentru {product_title}. Banii blocați la card vor fi eliberați după verificarea echipei Rentli (1–3 zile lucrătoare). Continui?*
- La confirmare: `UPDATE rentals SET status='cancelled', cancellation_reason='renter_cancelled_after_payment', cancelled_at=now() WHERE id=...`
- Apel edge function `send-cancellation-notification` (există deja) pentru email-ul proprietarului.
- Apel nou la o edge function `create-renter-cancellation-ticket` (vezi #3) care creează un ticket TCK pentru echipa admin.
- Toast: *"Cererea a fost anulată. Banii vor fi eliberați după verificarea echipei."*
- Invalidare query `my-rentals`.

### 3. Edge function nouă: `supabase/functions/create-renter-cancellation-ticket/index.ts`
- Validează JWT + că `auth.uid() === rental.renter_id`.
- Creează rând în `ops_tickets`:
  - `category_group = 'PAYMENTS'`, `category_type = 'REFUND_REQUEST'`
  - `priority = 'HIGH'`
  - `title = 'Anulare cerere plătită — necesită eliberare hold Stripe'`
  - `description` cu detalii rezervare + `payment_intent_id`
  - `requester_user_id = renter_id`, `rental_user_id = renter_id`, `owner_user_id`, `product_id`, `reservation_id = rental.id`
- Mesaj inițial intern (`is_internal=true`) cu link Stripe către `pi_...` pentru ca admin-ul să poată face refund cu un click.

### 4. `src/data/uxCopy.ts`
Adaug chei bilingve:
- `dashboard.cancelRequest` → "Anulează cererea" / "Cancel request"
- `dashboard.cancelPaidConfirm` → textul AlertDialog (RO/EN)
- `dashboard.cancelPaidSuccess` → mesaj toast (RO/EN)

## Ce NU schimbăm

- Logica din `RequestsTab` (cereri neplătite cu fereastră de 24h) rămâne identică.
- Cererile `confirmed`/`active` rămân fără buton de anulare self-serve (necesită contact admin).
- Nu se face refund automat la Stripe — admin face manual din ticket.

## Tehnic

```text
RentalsTab "awaitingOwnerRentals"
  ├─ buton [Anulează cererea] (nou, destructive outline)
  └─ AlertDialog → confirm
        ├─ UPDATE rentals (status=cancelled, reason, cancelled_at)
        ├─ invoke send-cancellation-notification  → email owner
        └─ invoke create-renter-cancellation-ticket → TCK admin
```
