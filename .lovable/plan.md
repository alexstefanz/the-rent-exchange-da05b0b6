# Returnare înainte de termen (în pasul „Produs predat")

## UX nou pe `RentalDetailPage` (afișat când `step === 5`, adică `handover_confirmed_at` setat și `return_confirmed_at` nesetat)

Apare un card portocaliu sub timeline (deasupra panoului „Procese verbale"), cu două CTA-uri:

1. **„Discută cu {proprietarul|chiriașul}"** — text variabil:
   - Chiriaș: „Vrei să predai produsul înainte de termen? Discută cu proprietarul"
   - Proprietar: „Vrei să ceri înapoi produsul înainte de termen? Discută cu chiriașul"
   - Buton secundar → `navigate(/messages?rental=<id>)` (deschide conversația existentă)

2. **„Solicită returnare anticipată"** — buton primar care deschide un nou dialog `EarlyReturnRequestDialog`.

### Eligibilitate buton (calculat client + server)
- `handover_confirmed_at != null && return_confirmed_at == null`
- `early_return_status` ∈ {`none`, null, `rejected`} (nu există deja una activă)
- `today` strict între `start_date` și `end_date` (deci NU în prima și NU în ultima zi a închirierii)
- `dispute_status` lipsă

Dacă există deja o cerere `pending` sau `accepted_partial`, cardul afișează statusul + acțiuni (vezi mai jos).

## `EarlyReturnRequestDialog` (nou)

Conține:
- `Calendar` (shadcn) cu disabled days: orice zi `<= start_date` sau `>= end_date` → permite doar `start_date+1` până la `end_date-1`
- `Textarea` motiv (min 20 caractere, max 500 — păstrăm validarea existentă)
- Calculator live de recalcul preț:
  - `new_days = differenceInCalendarDays(new_end_date, start_date) + 1` (sau formula folosită azi pentru `rental_days`)
  - `new_subtotal = daily_price * new_days`
  - `refund = subtotal - new_subtotal` (afișat în RON, ne-negativ)
  - Notă: comisionul rămâne calculat pe subtotalul inițial (politică actuală, refundul afectează doar partea chiriașului). Mențiune vizibilă în dialog.
- Submit → invocă edge function `request-early-return` (extinsă, vezi mai jos).

## Card de status (când există cerere activă)

Înlocuiește `EarlyReturnResponseCard` actual cu un card unificat afișat ambilor:
- Inițiator + data propusă + motiv + recalcul preț + refund
- Două bife: „Aprobat chiriaș" / „Aprobat proprietar" cu dată
- Buton „Aprobă" pentru cel care nu a aprobat încă (inițiatorul e aprobat automat)
- Buton „Respinge" pentru contraparte
- Când ambii au aprobat → status `accepted`, `end_date` se actualizează la `early_return_new_end_date`, `rental_days` și `subtotal` se recalculează, restul fluxului (PV Returnare) continuă normal pe noua dată
- Refundul se procesează la finalul rentalului prin fluxul existent (`captured_amount` redus). Pentru MVP: doar marcăm `early_return_refund_amount`; nu modificăm Stripe charge aici (păstrăm consistența cu codul existent).

## Modificări DB (migrație nouă)

Adăugăm coloane în `rentals`:
- `early_return_new_end_date date` — data propusă
- `early_return_initiator uuid` — `owner_id` sau `renter_id`
- `early_return_renter_approved_at timestamptz`
- `early_return_owner_approved_at timestamptz`
- `early_return_new_subtotal numeric(10,2)`
- `early_return_new_rental_days int`

Statusuri folosite în `early_return_status`: `none` (default), `pending`, `accepted`, `rejected`, `cancelled`.

Constraint trigger (validation trigger, nu CHECK) care impune:
- `early_return_new_end_date > start_date AND early_return_new_end_date < end_date`
- `early_return_initiator IN (renter_id, owner_id)`

Index parțial pe `(early_return_status)` pentru cererile pending.

## Edge functions

### `request-early-return` (modificat)
- Acceptă acum `initiator_role: "owner" | "renter"` (derivat din `userId`)
- Acceptă `new_end_date` (string ISO date) obligatoriu
- Validează:
  - userId == renter_id sau owner_id
  - data strict între `start_date` și `end_date`
  - data curentă strict între start și end
  - nu există cerere `pending`
- Calculează `new_rental_days` și `new_subtotal`
- Setează: `early_return_status='pending'`, `early_return_initiator`, `early_return_new_end_date`, `early_return_new_subtotal`, `early_return_new_rental_days`, `early_return_refund_amount = subtotal - new_subtotal`, `early_return_reason`, marchează auto-aprobarea inițiatorului (`early_return_<role>_approved_at = now()`)
- Notifică contraparte cu `event_key` nou: `early_return_proposed`

### `respond-early-return` (modificat)
- Acceptă `action: "approve" | "reject"`
- Validează: userId este contrapartea inițiatorului
- Pe `approve`:
  - setează `early_return_<role>_approved_at = now()`
  - dacă ambele aprobate → `early_return_status='accepted'`, `early_return_decided_at=now()`, actualizează `end_date = early_return_new_end_date`, `rental_days = early_return_new_rental_days`, `subtotal = early_return_new_subtotal`
- Pe `reject`: `early_return_status='rejected'`, status rental revine la `active`

Notificări noi în `notify-rental-event`: `early_return_proposed`, `early_return_approved`, `early_return_rejected` (template-uri email scurte, identice ca structură cu cele existente).

## Fișiere atinse

- DB: migrație nouă (coloane + trigger + index)
- Edge: `supabase/functions/request-early-return/index.ts`, `supabase/functions/respond-early-return/index.ts`
- API: `src/features/rentals/ownerRentalsApi.ts` — semnături actualizate (`requestEarlyReturn(rentalId, { newEndDate, reason })`, `respondEarlyReturn(rentalId, "approve"|"reject")`)
- Componente noi: `src/components/rentals/EarlyReturnPromptCard.tsx`, `src/components/rentals/EarlyReturnRequestDialog.tsx`, `src/components/rentals/EarlyReturnStatusCard.tsx`
- `EarlyReturnResponseCard.tsx` — eliminat sau redus la wrapper care randează noul `EarlyReturnStatusCard`
- `src/pages/RentalDetailPage.tsx` — montează cele 2 carduri noi în zona PV când `step === 5`
- `src/integrations/emails/` — 3 template-uri scurte noi (proposed/approved/rejected) urmând stilul existent
- Memorie proiect: nouă intrare `mem://features/early-return-flow`

## Out of scope (MVP)

- Modificarea efectivă a `payment_intent` în Stripe pentru refund parțial — rămâne pe fluxul existent de capturare/refund manual
- Modificarea comisionului platformei
- Modificarea calendarului de disponibilitate al produsului înainte ca PV Returnare să fie semnat (eliberăm zilele doar la `return_confirmed_at`)
