## Obiectiv

Reducerea drastică a clutter-ului din `/rezervari` și `/inchirieri`. O singură întrebare la care utilizatorul găsește răspuns instant: **„Ce trebuie să fac acum?"**. Coordonarea (oră, loc, dată) trece complet în chat. Timeline-ul devine doar pentru confirmări oficiale.

## Structura nouă a paginii (atât renter cât și owner)

```text
┌──────────────────────────────────────────────┐
│  Header rezervare (foto, titlu, date, status)│
├──────────────────────────────────────────────┤
│  TIMELINE COMPACT (6 pași, orizontal)        │
├──────────────────────────────────────────────┤
│  MAIN ACTION CARD (unul singur, dinamic)     │
│   - titlu + descriere scurtă                 │
│   - 1 CTA primary (orange) + 1 secondary chat│
│   - sub-status PV (ex: „tu ✓ · partener …") │
├──────────────────────────────────────────────┤
│  ▸ Status plată (collapsible, închis default)│
│  ▸ Acțiuni suport (link-uri text mici)       │
└──────────────────────────────────────────────┘
```

Ce dispare de pe card:
- `PickupArrangementCard` (propunerea de oră/locație) — eliminat din UI
- `PostHandoverActionsCard` separat — comprimat în „Acțiuni suport"
- `CancellationStateCard` ca bloc mare — devine link „Anulează rezervarea" în meniu secundar
- Dublarea butoanelor camera + NextActionCard
- Banner-ul „Plata a fost autorizată" (devine sub-text în action card la pasul 2)
- Toate badge-urile colorate redundante din timeline

## Timeline nou (6 pași)

```text
1. Cerere trimisă  →  2. Aprobată  →  3. Predare  →  4. În folosire  →  5. Returnare  →  6. Finalizat
```

Maparea status → pas (în `getTimelineStep`):
- `pending` (fără plată autorizată) → 1
- `pending` cu `payment_status` authorized/paid, sau `confirmed` înainte de start → 2
- `confirmed` (start atins) sau `active` fără handover → 3
- `active` cu handover, înainte de end_date → 4
- `active` cu end_date atins, fără return confirmat → 5
- `completed` / `return_confirmed_at` → 6
- `cancelled` → snapshot la pasul 2 marcat anulat

Stilistică:
- Future = `bg-muted text-muted-foreground` (gri neutru)
- Active = orange `#F98715` cu pulse subtil + glow fin (`shadow-[0_0_0_6px_rgba(249,135,21,0.12)]`)
- Completed = verde discret `text-emerald-600` cu `Check`, fără pulse
- Linie de progres animată cu `transition-[width] duration-700`
- Mobile: scroll orizontal cu `snap-x`, dot-uri mai mici, label sub punct doar pentru pasul curent

## Main Action Card — matricea de stări

Card unic, două CTA max. Conținut în `uxCopy.ts` (RO/EN), centralizat.

| Pas | Rol | Titlu | Sub-status | Primary CTA | Secondary |
|---|---|---|---|---|---|
| 1 | renter | Așteaptă confirmarea plății | – | – | Deschide chat |
| 2 | renter | Așteaptă răspunsul proprietarului | „24h pentru răspuns" | – | Deschide chat |
| 2 | owner | Răspunde la cerere | „expiră în Xh" | Acceptă cererea | Refuză |
| 3 | ambii | Pregătește predarea produsului | „Discută detaliile în chat și completează procesul verbal" | **Începe procesul verbal** | Deschide chat |
| 3+ PV propriu trimis | ambii | Așteptăm cealaltă parte | „Tu ✓ · Partener …" | (disabled) Confirmă predarea | Deschide chat |
| 3+ ambele PV | owner | Confirmă predarea | „PV semnat de ambele părți" | **Confirmă predarea** | Deschide chat |
| 4 | ambii | Produs activ | „Returnare pe DD MMM" | – | Deschide chat |
| 5 | ambii | Pregătește returnarea | „Completați procesul verbal de retur" | **Începe procesul verbal** | Deschide chat |
| 5+ ambele PV | owner | Confirmă returnarea | – | **Confirmă returnarea** | Deschide chat |
| 6 | ambii | Rezervare finalizată | – | Lasă o recenzie | Deschide chat |
| dispute | ambii | În verificare suport | – | Vezi tichetul | Deschide chat |

Reguli vizuale:
- 1 singur card. Doar 2 butoane vizibile (primary + chat). Restul (raportează problemă, anulează, retur anticipat) intră într-un meniu „⋯ Mai multe" pe desktop / bottom sheet pe mobile.
- Sub-status PV este o linie discretă cu două bife: `Tu ✓ · Partener ⏳`.
- Mobile: CTA primary devine sticky în partea de jos a viewport-ului când card-ul iese din viewport.

## Proces verbal — gating

Un singur dialog (`InspectionDialog` existent) deschis din primary CTA. Reguli:
- Owner deschide PV-ul de predare → status devine „PV de la proprietar" → notifică renter (in-app + email + SMS — flow existent `notify-rental-event` cu `pv_pickup_pending`).
- Renter completează → ambele rânduri în `rental_inspections` (phase `checkout`).
- Doar când ambele PV există, butonul **Confirmă predarea** se deblochează (vizual locked cu pictogramă lacăt + tooltip „Așteptăm celălalt PV"). Backend-ul deja blochează (`PV_INCOMPLETE_HANDOVER`).
- Identic pentru retur (phase `checkin`) — buton **Confirmă returnarea** unlock când ambele PV de retur sunt salvate.
- După confirmarea oficială, PV devine immutable (există deja `locked_at` + RLS fără UPDATE).

## Schimbări de cod

### Frontend

Refactor (păstrate ca componente, conținut rescris):
- `src/components/dashboard/RentalTimeline.tsx` — palete reduse la 3 stări (future/active/completed), 6 pași, animație `pulse` doar pe activ. `getTimelineStep` rescris pentru 6 pași.
- `src/components/dashboard/NextActionCard.tsx` → redenumit logic în „Main Action Card", maxim 2 CTA, sub-status PV nou.
- `src/components/dashboard/RentalsTab.tsx` & `RentalsOutTab.tsx` — eliminate: `PickupArrangementCard`, `PostHandoverActionsCard` mare, butoanele camera duplicat, banner-ul „Plata autorizată", `CancellationStateCard` mare. Lăsat doar header + Timeline + MainActionCard + collapsible plată + meniu acțiuni secundare.
- `src/data/uxCopy.ts` — secțiunea `timeline.nextAction` rescrisă pentru cele 11 stări de mai sus, plus chei noi `pvSubStatus.youDone / partnerDone / waiting / lockedTooltip`.

Componente noi:
- `src/components/dashboard/MainActionCard.tsx` — preia rolul lui `NextActionCard`, primește `pvProgress` (ownerSubmitted, renterSubmitted) și calculează stare + CTA + locked.
- `src/components/dashboard/SecondaryActionsMenu.tsx` — Popover/BottomSheet cu „Anulează rezervarea", „Cere retur anticipat", „Raportează problemă".
- `src/components/dashboard/PaymentStatusCollapsible.tsx` — wrapper subțire peste `RentalPaymentStatus`, închis default.
- `src/hooks/usePvProgress.ts` — query care returnează `{ ownerCheckout, renterCheckout, ownerCheckin, renterCheckin }` din `rental_inspections`.

Componente eliminate (referințe șterse):
- `src/components/dashboard/PickupArrangementCard.tsx`
- Folosirea inline a `PostHandoverActionsCard` ca bloc mare (rămâne doar invocată din meniul secundar pentru „Cere retur anticipat").

Mobile:
- `MainActionCard` are variantă sticky bottom pe `< md` când e scrolat în afara viewport-ului (IntersectionObserver, deja folosit altundeva).
- Timeline orizontal cu `overflow-x-auto snap-x snap-mandatory`.

### Backend (minim, doar ce e necesar pentru a permite confirmarea fără pickup arrangement)

Migrație nouă:
- Modifică triggerul/funcția de pe `rentals` care aruncă `PICKUP_NOT_AGREED` (definită în `20260511052023_…sql`) astfel încât **să nu mai blocheze** confirmarea predării. Înlocuit cu o condiție mai slabă: confirmarea predării permisă dacă există rândurile PV (rămân `PV_INCOMPLETE_HANDOVER` / `PV_INCOMPLETE_RETURN`). Coloana `pickup_agreed_at` și RPC-urile `propose_pickup` / `confirm_pickup` rămân (compatibilitate, nefolosite din UI), dar nu mai sunt obligatorii.
- `send-pickup-reminders` rămâne dezactivat de facto (filtrul pe `pickup_agreed_at` nu va mai găsi rezervări); va fi marcat ca deprecated într-un comentariu, fără modificări de cod în această iterație.

Restul backend-ului (notificări PV, capture Stripe, dispute) este deja compatibil.

## Memory

Adaug `mem://features/rental-flow-redesign-v3` cu noile reguli (timeline 6 pași, MainActionCard unic, fără propunere de pickup, gating PV bilateral).

## Detalii tehnice

- Paleta nouă în Tailwind (semantic, nu hardcodat): folosim tokenii existenți `--primary` (#F59E0B), `--accent`, plus `--muted`. Verde completed: clasă utilitară `text-emerald-600` (deja folosită în 7-step-ul actual).
- Animația pulse: `animate-pulse` Tailwind + `shadow-[0_0_0_6px_hsl(var(--primary)/0.12)]`.
- Toată logica de stat trăiește în `MainActionCard` (pure derivată din `rental` + `pvProgress` + `role`); nu adăugăm state suplimentar în `RentalsTab`.
- Internaționalizare RO/EN prin `uxCopy.ts` + `useUxCopy()` (pattern existent).
- Realtime: `useRentalRealtime` invalidează deja `rental_inspections` — `usePvProgress` se actualizează automat.
- Zero schimbări la `InspectionDialog`, `OpenDisputeDialog`, `LeaveReviewDialog`, `EarlyReturnRequestDialog` (sunt invocate ca atare).

## Acceptance criteria

- Pe `/rezervari` și `/inchirieri` fiecare card de rezervare conține: header → timeline 6 pași → 1 main action card → collapsible plată → meniu „⋯". Nimic în plus.
- Nicăieri în UI nu mai apar inputurile pentru oră/dată/locație predare.
- CTA-ul „Confirmă predarea/returnarea" este disabled până când ambele PV sunt salvate, cu tooltip explicit.
- Pe mobile, primary CTA devine sticky bottom când card-ul iese din viewport.
- Build și tipuri OK; toate referințele la `PickupArrangementCard` eliminate.
