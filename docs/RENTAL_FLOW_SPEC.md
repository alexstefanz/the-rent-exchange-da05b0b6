# Rentli — Specificația completă a fluxului de închiriere (Proprietar ↔ Chiriaș)

> Document de referință pentru replicarea 1:1 a procesului din web app într-o aplicație nativă/mobilă.
> Regula de aur: **aplicația mobilă NU reimplementează logica** — apelează exact aceleași RPC-uri
> Postgres și edge functions Lovable Cloud ca web app-ul. Orice calcul dublat în client va crea discrepanțe.

---

## 1. Context și reguli de bază

- Marketplace peer-to-peer de închirieri (România), model **escrow**: banii sunt blocați (hold) la plată și
  capturați abia la finalizarea returului.
- Roluri: **proprietar** (owner), **chiriaș** (renter), **admin** (suport/moderare).
- Comision platformă: **15%** aplicat **peste** subtotalul net al proprietarului, cu **minim 1 RON**.
  - `subtotal = daily_price × rental_days` (net proprietar)
  - `platform_fee = max(1, round(subtotal × 15%))` — 0 dacă `platform_fee_percent = 0`
  - `total plătit de chiriaș = subtotal + platform_fee`
  - `owner_payout = subtotal`
  - Sursă unică: `src/lib/rentalPricing.ts` (`computeRentalPrice`, `calcPlatformFee`, `calcClientTotal`).
- Minim acceptat de procesatorul de plată: **2 RON** total. Sub această valoare, `create-checkout-session`
  întoarce `error: "MIN_AMOUNT"` și UI-ul afișează mesaj dedicat.
- Toate ecranele de rezervare folosesc ruta canonică `/rezervari/<public_id>` (ex. `RNT-XXXXXX`).

---

## 2. Modelul de date

### `rentals` (coloane relevante)

| Grup | Coloane |
|---|---|
| Identitate | `id`, `public_id` (RNT-XXXXXX, generat de trigger), `product_id`, `renter_id`, `owner_id` |
| Perioadă | `start_date`, `end_date`, `rental_days` |
| Bani | `daily_price`, `subtotal`, `platform_fee`, `platform_fee_percent`, `owner_payout`, `wallet_credit_applied`, `refund_amount`, `owner_compensation` |
| Stare | `status`, `payment_status`, `payment_method`, `is_test_payment` |
| Timestamps | `created_at`, `confirmed_at`, `paid_at`, `authorized_at`, `captured_at`, `handover_confirmed_at`, `return_confirmed_at`, `completed_at`, `cancelled_at`, `refunded_at` |
| Stripe | `payment_intent_id` |
| Predare | `pickup_proposal` (jsonb), `pickup_agreed_at`, `pickup_location`, `pickup_time`, `pickup_reminder_sent_at` |
| Dispute | `dispute_status`, `dispute_phase`, `dispute_reason`, `dispute_opened_by`, `dispute_opened_at` |
| Anulare | `cancellation_tier`, `cancelled_by`, `cancellation_reason`, `rejection_reason`, `cancel_request_*` |
| Retur anticipat | `early_return_status`, `early_return_new_end_date`, `early_return_new_subtotal`, `early_return_new_rental_days`, `early_return_initiator`, `early_return_renter_approved_at`, `early_return_owner_approved_at`, `early_return_refund_amount`, `early_return_reason` |
| UX | `message_to_owner`, `renter_seen_confirmation`, `owner_popup_seen_count` |

### Tabele adiacente

- `rental_inspections` — o linie per (rental, `phase`, `role`): `photos[]`, `checklist` jsonb,
  `declaration_accepted`, `notes`, `locked_at`. **Insert-only** (fără UPDATE/DELETE din client).
- `rental_pv_documents` — un document per (rental, `phase` ∈ `handover|return`): `photos[]`, `photos_meta`,
  `owner_signature_data`, `renter_signature_data`, `owner_signed_at`, `renter_signed_at`, `pdf_path`,
  `generated_at`. PDF-ul se generează prin edge function `generate-pv-pdf`, se citește prin
  RPC `get_rental_pv_signed_url` (bucket privat `rental-pvs`).
- `rental_status_history` — audit read-only al tranzițiilor (`from_status`, `to_status`, `actor_id`, `actor_role`).
- `transactions`, `wallet_ledger`, `withdrawal_requests` — bani.
- `notifications` (in-app), `sms_logs`, `email_send_log`, `notification_audit_log`.
- `product_reviews` (multi-criteriu) și `user_reviews`, ambele legate prin `rental_id`.

### Structura `pickup_proposal`

```json
{
  "proposed_by": "<uuid>",
  "proposed_at": "<iso>",
  "time": "<iso>",
  "place": "text liber",
  "owner_confirmed_at": "<iso|null>",
  "renter_confirmed_at": "<iso|null>"
}
```

---

## 3. Mașina de stări

```text
                 creare cerere
                       |
                       v
                  [ pending ] --(owner reject)--> [ cancelled ] (rejection_reason)
                       |        --(48h fara raspuns)--> [ cancelled ] (request_expired)
                       |        --(oricare parte, neplatit)--> [ cancelled ]
             owner accept (respond-rental-request)
                       v
                  [ confirmed ]   payment_status: pending
                       |
        plata chirias: Stripe hold SAU wallet
                       v
                  [ confirmed ]   payment_status: paid (authorized_at set)
                       |
        propose_pickup + confirm_pickup (ambele parti)
                       v
              pickup_agreed_at != null
                       |
        PV predare: ambele parti (min 3 poze) + semnaturi
                       v
             confirm_rental_handover  ->  handover_confirmed_at
                       v
                  [ active ]
                       |
       (optional) retur anticipat: dubla aprobare -> recalcul end_date/subtotal
                       v
        PV retur: ambele parti (min 3 poze) + semnaturi
                       v
        capture-rental-payment  ->  payment_status: captured
                       v
             confirm_rental_return  ->  return_confirmed_at
                       v
                 [ completed ]  -> payout proprietar + review reminder
```

`payment_status`: `pending → paid` (hold/wallet autorizat) `→ captured` (bani încasați)
`→ refund_pending → refunded`; `failed` la eroare de procesator.

`dispute_status`: `none → open → resolved`. Cât timp e `open`, **niciun** `confirm_rental_handover` /
`confirm_rental_return` nu trece (eroare `PV_DISPUTE_OPEN`).

---

## 4. Pas cu pas

### Pasul 1 — Chiriașul trimite cererea

**Ecran:** pagina produsului → calendar disponibilitate (`get_booked_dates`) → checkout (`/checkout`).

- Client: `createRentalRequest()` (`src/features/rentals/rentalsApi.ts`)
  1. INSERT în `rentals` cu `status='pending'`, `payment_status='pending'`, prețuri precalculate cu
     `computeRentalPrice`, `message_to_owner` opțional.
  2. `functions.invoke("send-rental-notification", { rental_id })` — email + in-app proprietar.
  3. `functions.invoke("notify-rental-event", { rental_id, event_key: "request_created" })` — SMS proprietar.
- Restricții: datele nu se pot suprapune cu rezervări active (`get_booked_dates`), `min_rental_days` /
  `max_rental_days` din produs, `available_from` / `blocked_dates`.
- Butoane RO: „Trimite cererea”, „Anulează”.
- Chiriașul **nu plătește** în acest pas (flux request-first).

**Notificări:** `request_created` → proprietar (in-app + email `rental-request-owner` + SMS
`rental_request_owner`), chiriaș (in-app + email `rental-request-renter`).

**Pop-up:** proprietarul primește `RentalRequestPopup` (vezi §8) cu acțiuni „Acceptă” / „Refuză” / „Deschide chat”.

**Deadline:** `send-request-deadline-reminders` trimite `request_reminder_2h`; după 48h fără răspuns,
cererea devine `cancelled` cu `request_expired` (hold-ul, dacă există, se eliberează integral).

---

### Pasul 2 — Proprietarul acceptă sau refuză

- Client: `respondToRental(rentalId, "accept" | "reject", reason?)` → edge `respond-rental-request`.
- Accept: `status='confirmed'`, `confirmed_at=now()`, se creează thread-ul de chat al rezervării
  (`get_or_create_rental_conversation`).
- Refuz: `status='cancelled'`, `cancelled_by='owner'`, `rejection_reason` obligatoriu; dacă exista un
  hold, se eliberează automat.
- Butoane RO: „Acceptă cererea”, „Refuză cererea” (dialog cu motiv).

**Notificări:** `request_accepted` (email `rental-accepted-owner` / `rental-accepted-renter`,
SMS `rental_accepted` către chiriaș) sau `request_rejected` (email `rental-rejected` către chiriaș).

---

### Pasul 3 — Plata (după acceptare)

Două ramuri, ambele pornite din cardul rezervării, buton RO „Plătește acum”:

**A. Stripe (hold)**
- `payForConfirmedRental(rentalId)` → edge `create-checkout-session` → redirect la URL-ul Stripe.
- Retur pe `/checkout/success` (verificare prin `verify-stripe-payment`) sau `/checkout/cancelled`.
- La succes: `payment_status='paid'`, `authorized_at`, `payment_intent_id`, `paid_at`.
- Erori tratate: `MIN_AMOUNT` (total < 2 RON) → mesaj dedicat, fără redirect.

**B. Wallet**
- `payRentalWithWallet(rentalId)` → RPC `pay_rental_with_wallet` (debitează `wallet_ledger`,
  setează `payment_status='paid'`, `payment_method='wallet'`, `wallet_credit_applied`).
- Returnează `{ ok, amount_charged, wallet_remaining }`.
- Dacă soldul e insuficient → eroare; UI cade pe ramura Stripe.

**Notificări:** `payment_succeeded` (in-app ambii, SMS `rental_accepted*`).

---

### Pasul 4 — Stabilirea predării

**Componentă:** `PickupArrangementCard`.

- Oricare parte propune: `proposePickup(rentalId, time, place)` → RPC `propose_pickup`
  (scrie `pickup_proposal`, setează confirmarea inițiatorului).
- Cealaltă parte: `confirmPickupArrangement(rentalId)` → RPC `confirm_pickup`.
  Când ambele confirmări există, serverul setează `pickup_agreed_at`, `pickup_time`, `pickup_location`.
- Clientul lansează apoi `pickup_scheduled` și `pv_pickup_pending`.
- Butoane RO: „Propune oră și loc”, „Confirmă întâlnirea”, „Propune altă variantă”.
- Reminder automat: `send-pickup-reminders` (marcat prin `pickup_reminder_sent_at`).

---

### Pasul 5 — PV de predare (handover)

**Componente:** `InspectionDialog`, `PvPhotoUploadCard`, `PvSignatureDialog`, `PvProgressBadge`.

Reguli obligatorii (impuse de triggerul `enforce_pv_gates`):
- Fiecare parte încarcă **minim 3 poze** (bucket privat `rental-inspections`).
- Checklist jsonb + `declaration_accepted = true` + semnătură.
- După semnarea ambelor părți documentul se blochează (`locked_at`, eroare `PV_LOCKED` la modificare).

Confirmare:
- Proprietar: `confirmHandover(rentalId)` → RPC `confirm_rental_handover` → `handover_confirmed_at`,
  `status='active'`.
- Chiriaș: `confirm_handover_received` (RPC) pentru confirmarea primirii.
- Erori mapate în UI: `PV_INCOMPLETE_HANDOVER`, `PV_DISPUTE_OPEN`, `PV_LOCKED`
  (texte RO exacte în `mapPvError`, `ownerRentalsApi.ts`).
- Fallback: `auto-confirm-handovers` / RPC `auto_confirm_overdue_handovers` pentru cazurile blocate.

**Notificări:** `pv_pickup_pending`, `pv_pickup_completed_by_party`, `handover_confirmed`
(email `handover-confirmed`, unul dintre cele 3 emailuri permise proprietarului), `active_rental_started`.

> Important: `handover_confirmed` este emis de triggerul DB `rentals_notify_status`.
> Clientul **nu** trebuie să mai apeleze `notify-rental-event` pentru el (dublează emailurile).

---

### Pasul 6 — Perioada activă

- Status `active`. Card `PostHandoverActionsCard` cu: „Solicită retur anticipat”, „Deschide dispută”,
  „Contactează proprietarul/chiriașul”.
- Din acest moment anularea este **LOCKED** (fără refund) — vezi §6.
- Remindere automate: `return_reminder_24h` (email `return-reminder`), `return_reminder_2h`
  (email `return-deadline-2h` + SMS), lansate de `send-return-reminders` / `send-return-deadline-reminders`
  și `notify-return-day`.
- Badge UI: `ReturnCountdownBadge`.

---

### Pasul 7 — PV de retur, captură și finalizare

1. `return_in_progress` / `pv_return_pending` notifică ambele părți (link `?pv=return`).
2. Ambele părți completează PV-ul de retur: minim 3 poze fiecare, checklist, declarație, semnătură.
3. Proprietarul apasă „Confirmă returul” → `confirmReturn(rentalId)`:
   - **întâi** edge `capture-rental-payment` (Stripe capture sau finalizare wallet) →
     `payment_status='captured'`, `captured_at`;
   - **doar apoi** RPC `confirm_rental_return` → `return_confirmed_at`, `status='completed'`,
     `completed_at`;
   - dacă captura eșuează, rezervarea NU devine `completed` (mesaj: „Captura plății a eșuat. Contactează suportul.”).
4. Client lansează `rental_completed` și `review_reminder`.
5. Payout proprietar: `owner_payout` intră în `wallet_ledger`; retragerea se face prin
   `withdrawal_requests` (aprobare admin, `payout_ibans`).
6. Recenzii: `LeaveReviewDialog` → `product_reviews` (criteriile `rating_product_condition`,
   `rating_communication`, `rating_punctuality`) și `user_reviews`, ambele legate de `rental_id`
   și permise doar pentru rezervări `completed`.

---

## 5. Anulări

`src/lib/cancellationPolicy.ts` (oglindit în `supabase/functions/_shared/cancellationPolicy.ts`):

| Tier | Condiție | Refund chiriaș | Compensație proprietar | Reținut platformă |
|---|---|---|---|---|
| `FREE` | ≥ 24h până la `start_date`, fără handover | `subtotal + platform_fee` | 0 | 0 |
| `LIMITED` | < 24h sau după start, fără handover | `subtotal − min(daily_price, subtotal)` | prima zi | `platform_fee` |
| `LOCKED` | `handover_confirmed_at` setat | 0 | — | — (anulare interzisă) |

Fluxuri:
- **Neplătit, oricare parte:** RPC `cancel_unpaid_rental` → eveniment
  `request_cancelled_by_renter` / `request_cancelled_by_owner`. Fără review admin.
- **Plătit:** `request_mutual_cancellation(rental_id, subject, reason)` → `cancel_request_status='pending'`
  → eveniment `cancel_request_submitted`. Inițiatorul poate retrage: `withdraw_cancellation_request`
  (`cancel_request_withdrawn`).
- **Admin:** `admin_respond_cancellation(rental_id, 'approve'|'reject', note)`;
  la approve rulează edge `mutual-cancel-rental` (refund) + `cancel_request_approved`,
  altfel `cancel_request_rejected`.
- Componente UI: `CancellationStateCard`, `MutualCancellationCard`.

---

## 6. Retur anticipat

- Disponibil doar în starea „Produs predat” (`handover_confirmed_at` setat, retur necompletat).
- `new_end_date` trebuie să fie **strict între** `start_date` și `end_date` (trigger `validate_early_return_request`).
- Inițiere: edge `request-early-return`; răspuns: edge `respond-early-return` (`approve` | `reject`).
- Inițiatorul e auto-aprobat; când există ambele aprobări (`early_return_renter_approved_at` și
  `early_return_owner_approved_at`), se suprascriu `end_date`, `rental_days`, `subtotal` cu valorile
  `early_return_new_*`.
- `new_subtotal = daily_price × new_days`; `early_return_refund_amount = subtotal − new_subtotal`.
  **Comisionul platformei rămâne calculat pe subtotalul inițial.**
- UI: `EarlyReturnCard`, `EarlyReturnRequestDialog`.

---

## 7. Dispute

- `openRentalDispute(rentalId, phase: "handover"|"return", reason)` → RPC `open_rental_dispute`
  (`dispute_status='open'`, `dispute_phase`, `dispute_reason`, `dispute_opened_by`).
- Efect: blochează confirmarea PV-ului și captura plății (`PV_DISPUTE_OPEN`).
- Notificare: `dispute_opened` (in-app + email `dispute-opened` + SMS `dispute_opened`, ambele părți).
- Rezolvare: doar admin, din panoul de administrare; textul UI promite răspuns în maxim 24h.
- UI: `OpenDisputeDialog`, `SupportFromRentalButton` (creează ticket `ops_tickets` legat de rezervare).

---

## 8. Catalog complet de notificări (`notify-rental-event`)

Politica de email pentru proprietar: primește **doar 3 emailuri** pe ciclu —
`request_created`, `handover_confirmed`, `rental_completed`. Restul evenimentelor îi ajung
in-app și, unde e configurat, prin SMS.

| `event_key` | Destinatari | Canale | Titlu in-app (RO) |
|---|---|---|---|
| `request_created` | ambii | in-app, email, SMS(owner) | Cerere nouă de închiriere |
| `request_accepted` | ambii | in-app, email, SMS(renter) | Cererea a fost acceptată |
| `payment_succeeded` | ambii | in-app (+SMS) | Plata a fost confirmată |
| `request_rejected` | ambii | in-app, email(renter) | Cererea a fost refuzată / Ai refuzat cererea |
| `request_reminder_2h` | ambii | in-app, email, SMS | ⏰ Mai ai 2 ore să răspunzi la cerere |
| `request_expired` | ambii | in-app, email, SMS | Cerere expirată automat |
| `pickup_scheduled` | ambii | in-app, email | Predarea a fost stabilită |
| `pv_pickup_pending` | ambii | in-app, email | Completează procesul verbal de predare |
| `pv_pickup_completed_by_party` | ambii | in-app, email | PV de predare completat parțial |
| `handover_confirmed` | ambii | in-app, email | Predarea a fost confirmată |
| `active_rental_started` | ambii | in-app | Închiriere activă |
| `return_reminder_24h` | ambii | in-app, email | Reminder returnare |
| `return_reminder_2h` | ambii | in-app, email, SMS | ⏰ Mai sunt 2 ore până la deadline |
| `return_in_progress` | ambii | in-app, email, SMS | Returnare în curs |
| `pv_return_pending` | ambii | in-app, email, SMS | PV de returnare necesar |
| `pv_return_completed_by_party` | ambii | in-app, email | PV de retur completat parțial |
| `rental_completed` | ambii | in-app, email | Închiriere finalizată |
| `review_reminder` | ambii | in-app, email, SMS | Lasă un review |
| `dispute_opened` | ambii | in-app, email, SMS | Dispută deschisă |
| `cancel_request_submitted` | ambii | in-app | Cerere de anulare trimisă |
| `cancel_request_withdrawn` | ambii | in-app | Cerere de anulare retrasă |
| `cancel_request_approved` | ambii | in-app | Anulare aprobată |
| `cancel_request_rejected` | ambii | in-app | Cerere de anulare respinsă |
| `cancellation_confirmed` | ambii | in-app | Rezervare anulată |
| `mutual_cancel_approved` | ambii | in-app | Anulare confirmată |
| `request_cancelled_by_renter` | proprietar | in-app, email, SMS | Cerere de închiriere anulată |
| `request_cancelled_by_owner` | chiriaș | in-app, email, SMS | Rezervare anulată de proprietar |

Toate link-urile duc la `/rezervari/<public_id>` (cu `?pv=handover`, `?pv=return` sau `?review=1` unde e cazul).
SMS-urile conțin un token securizat (`secure_action_tokens`, rezolvat prin edge `resolve-action-token`),
deci deep-link-urile din aplicația mobilă trebuie să treacă prin același resolver.

---

## 9. Pop-up-uri și realtime

- RPC `get_rental_popups()` întoarce coada combinată: cereri `pending` pentru proprietar +
  confirmări nevăzute pentru chiriaș (`renter_seen_confirmation = false`), cu câmpul `outcome`
  (`pending | confirmed | rejected`) și `category_slug`.
- `mark_renter_confirmation_seen(_rental_id)` marchează pop-up-ul ca văzut la orice click.
  Pentru proprietar persistența e implicită (reapare cât timp `status='pending'`).
- Realtime pe tabelul `rentals`: INSERT filtrat pe `owner_id`, UPDATE filtrat pe `renter_id`.
- Realtime pe `notifications` filtrat pe `user_id` (INSERT/UPDATE/DELETE) — vezi `useNotifications`.
- Realtime pe `messages` / `conversations` pentru chat-ul rezervării.
- Poziționare UI: bottom-right pe desktop, bottom-center pe mobil.

---

## 10. Surse de adevăr (endpoint-uri de reutilizat în mobil)

**RPC-uri:** `get_rental_full_detail`, `get_rental_by_public_id`, `get_rental_details`, `get_owner_rentals`,
`get_booked_dates`, `propose_pickup`, `confirm_pickup`, `confirm_rental_handover`,
`confirm_handover_received`, `confirm_rental_return`, `open_rental_dispute`, `pay_rental_with_wallet`,
`request_mutual_cancellation`, `withdraw_cancellation_request`, `cancel_unpaid_rental`,
`admin_respond_cancellation`, `get_rental_popups`, `mark_renter_confirmation_seen`,
`get_rental_pv_signed_url`, `get_rental_renter_info`, `get_user_wallet_balance`.

**Edge functions:** `create-checkout-session`, `verify-stripe-payment`, `capture-rental-payment`,
`respond-rental-request`, `notify-rental-event`, `send-rental-notification`, `generate-pv-pdf`,
`request-early-return`, `respond-early-return`, `mutual-cancel-rental`, `resolve-action-token`,
`auto-confirm-handovers`, `send-pickup-reminders`, `send-return-reminders`,
`send-return-deadline-reminders`, `send-request-deadline-reminders`, `notify-return-day`.

---

## 11. Checklist de paritate web ↔ mobil

- [ ] Prețul afișat = `subtotal + platform_fee` (15%, minim 1 RON), niciodată recalculat local diferit.
- [ ] Blocare checkout sub 2 RON cu mesajul `MIN_AMOUNT`.
- [ ] Flux request-first: plata **după** acceptarea proprietarului.
- [ ] Ambele metode de plată: Stripe hold și wallet.
- [ ] Predare stabilită prin dublă confirmare înainte de PV.
- [ ] PV cu minim 3 poze per parte, checklist, declarație și semnătură; blocare după semnare.
- [ ] Captura plății **înainte** de marcarea ca finalizat.
- [ ] Tier-urile de anulare FREE / LIMITED / LOCKED cu aceleași formule.
- [ ] Retur anticipat cu dublă aprobare și recalcul de subtotal.
- [ ] Dispute blochează confirmările PV și captura.
- [ ] Toate cele 28 de `event_key` declanșate din aceleași puncte (fără dubluri pe `handover_confirmed`).
- [ ] Deep-link-uri prin `resolve-action-token`, rute `/rezervari/<public_id>`.
- [ ] Abonări realtime pe `rentals`, `notifications`, `messages`.
- [ ] Recenzii multi-criteriu doar pe rezervări `completed`.
