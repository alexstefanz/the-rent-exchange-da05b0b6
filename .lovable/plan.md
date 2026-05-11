# Sistem complet anulări, refund-uri și returnare anticipată

## 1. Noua politică de refund (logică simplă, "prima zi nerambursabilă")

Înlocuim tier-ul actual `PARTIAL_50` cu logica cerută:

| Moment anulare | Tier | Refund chiriaș | Owner primește |
|---|---|---|---|
| Mai mult de 48h înainte | `FREE` | 100% subtotal + fee | 0 |
| Între 48h și 24h | `FIRST_DAY_FORFEIT` | subtotal − 1×daily_price | 1×daily_price |
| Sub 24h, înainte de start | `LIMITED` | subtotal − 1×daily_price − platform_fee | 1×daily_price |
| După start dar înainte de predare PV | `LIMITED` | la fel ca sub 24h |
| După `handover_confirmed_at` (PV semnat) | **NU MAI EXISTĂ ANULARE** | — | — |

Taxa platformei (`platform_fee`) nu este returnată în tier `LIMITED` (compensează costurile Stripe + procesare).

## 2. Schema DB (migrare)

Adăugăm pe `rentals`:
- `early_return_requested_at`, `early_return_decided_at`, `early_return_status` (`none`/`pending`/`accepted`/`rejected`)
- `early_return_reason`, `early_return_owner_response`, `early_return_refund_amount` (negociat de owner)
- `cancellation_tier` (`FREE`/`FIRST_DAY_FORFEIT`/`LIMITED`)
- `cancelled_by` (`renter`/`owner`/`admin`)
- `refund_amount`, `owner_compensation` (snapshot la momentul anulării)

Tabelă nouă `rental_status_history` (audit immutable):
- `rental_id`, `from_status`, `to_status`, `actor_id`, `actor_role`, `reason`, `metadata` (jsonb cu device/IP), `created_at`

RLS: SELECT pentru participanți + admin; INSERT doar service-role (via trigger).

Trigger `trg_rentals_status_history` care loghează orice schimbare de status.

## 3. Backend — edge functions

**Refactor `cancel-rental-by-renter`**:
- Înlocuiește calculul tier cu noua logică (folosește `daily_price` și `platform_fee` din rental)
- Blochează ferm dacă `handover_confirmed_at IS NOT NULL` → returnează cod `HANDOVER_DONE_USE_EARLY_RETURN`
- Pentru `FIRST_DAY_FORFEIT` și `LIMITED` cu PI în `requires_capture`: capture parțial cu `amount_to_capture = owner_compensation * 100`
- Pentru PI deja captured: `refund` parțial
- Salvează `cancellation_tier`, `refund_amount`, `owner_compensation` pe rental
- Declanșează `notify-rental-event` cu `event_key = "cancellation_confirmed"` (email + SMS + in-app pentru ambele părți)

**Funcție nouă `request-early-return`** (chiriaș):
- Validări: rental activ, `handover_confirmed_at IS NOT NULL`, fără return PV completat, fără dispută activă
- Setează `status = "early_return_requested"`, `early_return_status = "pending"`, salvează motivul
- Notifică ownerul (email + SMS + in-app)

**Funcție nouă `respond-early-return`** (owner):
- Acțiuni: `accept` (cu `proposed_refund_amount` opțional, default 0) / `reject`
- Pe `accept`: status revine la `active` cu flag `early_return_status="accepted"`, deschide flow de PV returnare. Refund-ul se face după PV signat de ambele părți, prin `capture-rental-payment` modificat să respecte `early_return_refund_amount`
- Pe `reject`: status revine la `active`, `early_return_status="rejected"`, deschide automat ticket suport opțional + notifică chiriașul

**Funcție nouă `open-dispute-after-handover`**:
- Wrapper peste `open_rental_dispute` RPC + creare ticket `ops_tickets` cu `category_group="DISPUTES"`, atașează poze PV
- Setează `status="dispute_review"`, fondurile rămân blocate

**Notificări**: extindem `notify-rental-event` event keys: `cancellation_confirmed_renter/owner`, `early_return_requested`, `early_return_accepted`, `early_return_rejected`, `refund_processed`, `dispute_opened_after_handover`. Adăugăm 6 templates noi în `_shared/transactional-email-templates/`.

## 4. Frontend — UI premium

**Componentă nouă `CancellationStateCard`** (folosită pe `RentalsTab` și pe pagina detaliu rezervare):
- Calculează tier-ul live după `start_date` și `handover_confirmed_at`
- 4 stări vizuale:
  - 🟢 `FREE` — "Anulare gratuită până la {data/oră}" (badge verde, buton primary)
  - 🟠 `FIRST_DAY_FORFEIT` — "Prima zi ({X} RON) devine nerambursabilă" (warning amber)
  - 🔴 `LIMITED` — "Refund limitat: vei primi {Y} RON din {subtotal}" (destructive)
  - 🔒 `LOCKED` — "Rezervarea este activă. Anularea nu mai este posibilă." + CTA-uri alternative

**Dialog confirmare anulare** (înlocuiește butonul brut din `RentalsTab.tsx`):
- Breakdown clar: subtotal, ce reține ownerul, ce primește chiriașul, când ajung banii
- Checkbox "Înțeleg politica" + buton confirmare disabled până e bifat

**Componentă nouă `PostHandoverActionsCard`** (afișată după PV predare):
- 3 CTA-uri: "Discută cu proprietarul" → `/mesaje/...`, "Solicită returnare anticipată" → dialog, "Raportează problemă" → dialog dispută

**Dialog `EarlyReturnRequestDialog`** (chiriaș):
- Textarea motiv (min 20 char), info clar: "Returnarea anticipată nu garantează rambursarea perioadei neutilizate"
- Buton submit → `request-early-return`

**Card `EarlyReturnResponseCard`** (owner, în `RentalsOutTab`):
- Afișează cererea + motivul
- Buton accept (cu input opțional sumă refund propusă) / reject (cu motiv)

**Pagină produs (`PremiumBookingCard` + `FreeCancellationNotice`)**:
- Înlocuim copy-ul actual cu policy card extins în 3 paragrafe + link "Vezi politica completă"

**Checkout (`Checkout.tsx`)**:
- Adăugăm secțiune "Politica de anulare" cu timeline vizual (3 puncte: 48h / 24h / după predare) și sume calculate pentru rezervarea curentă

**Pagina `CancellationPolicy.tsx`**:
- Rescrisă bilingv pentru a reflecta noua logică (prima zi nerambursabilă, post-handover = doar early return/dispute)

## 5. Eliminare buton anulare după predare

În `RentalsTab.tsx` și `RentalsOutTab.tsx`:
- Butoanele "Anulează" se ascund când `handover_confirmed_at IS NOT NULL`
- Sunt înlocuite automat de `PostHandoverActionsCard`

## 6. Audit și protecție

- Triggerul `rental_status_history` loghează tot
- `cancel-rental-by-renter` și `request-early-return` salvează `device_info` (User-Agent + IP) în metadata
- Procesele verbale `rental_inspections` sunt deja immutable (RLS fără UPDATE/DELETE) — confirmat
- Rate limiting păstrat (5/min per user) pe toate funcțiile critice

## Fișiere atinse

**Migrare nouă** (1) — coloane noi pe `rentals`, tabel `rental_status_history`, trigger
**Edge functions**:
- Refactor: `cancel-rental-by-renter`, `notify-rental-event` (event keys noi), `capture-rental-payment` (respectă early_return refund)
- Noi: `request-early-return`, `respond-early-return`, `open-dispute-after-handover`
- 6 template-uri email noi

**Frontend nou**:
- `src/components/rentals/CancellationStateCard.tsx`
- `src/components/rentals/CancellationConfirmDialog.tsx`
- `src/components/rentals/PostHandoverActionsCard.tsx`
- `src/components/rentals/EarlyReturnRequestDialog.tsx`
- `src/components/dashboard/EarlyReturnResponseCard.tsx`
- `src/lib/cancellationPolicy.ts` (helper pur pentru calcul tier + sume, share client + server)

**Frontend modificat**:
- `src/components/dashboard/RentalsTab.tsx`, `RentalsOutTab.tsx`
- `src/components/product/FreeCancellationNotice.tsx`, `PremiumBookingCard.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/legal/CancellationPolicy.tsx`
- `src/features/rentals/ownerRentalsApi.ts` (API early return + dispute post-handover)

## Note tehnice

- Calculul refund-ului trăiește într-un singur fișier (`src/lib/cancellationPolicy.ts`) și e copiat 1-la-1 în edge function pentru consistență
- Toate sumele sunt în RON cu precizie 2 zecimale; conversie la `bani` (×100) doar la apelul Stripe
- Statusurile noi (`early_return_requested`, `dispute_review`) sunt deja tolerate de UI-ul existent prin `StatusBadge` — vom adăuga mapping-uri lipsă
- Memoria pentru `business-logic/rental-lifecycle-and-financials` va fi actualizată după implementare
