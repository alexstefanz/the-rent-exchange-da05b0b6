# Redesign Flow Rezervare & Închiriere

## Obiectiv
Transformare flow-ului actual (6 statusuri) într-o experiență premium cu **7 pași clari**, **proces verbal ca checkpoint oficial**, **timeline animat realtime** și **next-action card** care ghidează utilizatorul pas cu pas.

## Flow nou (7 pași)

```text
1. Cerere trimisă          (status: pending)
2. Cerere aprobată         (status: confirmed, înainte de start_date)
3. În tranzit              (start_date trecut, fără handover_confirmed_at)
4. Confirmare primire      (proces verbal predare — checkpoint oficial)
5. Produs în folosire      (handover_confirmed_at setat, înainte de end_date)
6. În curs de returnare    (end_date trecut, fără return_confirmed_at)
7. Finalizat               (return_confirmed_at setat → status: completed)
```

Mapare logică în `getTimelineStep()` din `RentalTimeline.tsx` — fără schimbări de schemă DB, doar reinterpretare timestamps existente (`handover_confirmed_at`, `return_confirmed_at`, `start_date`, `end_date`).

## Componente noi / refăcute

### 1. `RentalTimelineV2.tsx` (înlocuiește `RentalTimeline.tsx`)
- 7 cercuri cu iconițe (Send, ThumbsUp, Truck, ClipboardCheck, Package, RotateCcw, CheckCircle2)
- Linie de progres animată (Framer Motion `width` transition)
- Pas activ: `pulse` subtil + glow ring
- Pași completați: scale-in animation, static
- Pas „Finalizat": pulse oprit, emerald glow
- Mobile: layout vertical compact; Desktop: orizontal cu labels

### 2. `NextActionCard.tsx` (NOU — sticky sub timeline)
Card mare premium cu:
- Iconiță contextuală
- Titlu „Ce trebuie să faci acum"
- Sub-text explicativ
- CTA primary (variabil: „Încarcă pozele", „Confirmă primirea", „Așteaptă confirmarea proprietarului", etc.)
- Stări per rol (renter vs owner) și per step

### 3. `InspectionWizard.tsx` (refactor complet din `InspectionDialog.tsx`)
Wizard step-by-step mobile-first cu progres bar sus:

```text
Step 1 → Introducere (de ce e important procesul verbal)
Step 2 → Poze obligatorii (min 3: față, spate, defecte)
Step 3 → Checklist (critice obligatorii + secundare opționale)
Step 4 → Observații (obligatorii dacă există puncte nebifate)
Step 5 → Declarație legală (2 checkboxes)
Step 6 → Confirmare finală (rezumat + CTA mare)
```

Validări per step blochează „Continuă". După confirmare: lock edit, salvare timestamp + audit metadata (deja avem device prin user agent în client logs).

### 4. `SupportFromRentalButton.tsx` (NOU)
Buton „Ai o problemă?" care creează automat ops_ticket cu:
- `rental_user_id`, `owner_user_id`, `reservation_id`, `product_id`
- titlu prefilat „Problemă rezervare {public_id}"
- categorie `RENTAL_DISPUTE`

### 5. `ChatQuickActions.tsx` (NOU — în NextActionCard)
- Buton „Discută cu proprietarul" / „Discută cu chiriașul" → navighează la `/messages?conversation=...`
- Disclaimer subtil: „Pentru siguranță, recomandăm comunicarea prin platformă."

### 6. `ReviewPromptDialog.tsx` (NOU)
Popup elegant la primul mount după `status=completed`:
- 2 CTA: „Lasă review acum" / „Mai târziu"
- Skip persistă în localStorage; reminder după 24h prin notificare in-app

## Realtime sync

În `RentalsTab.tsx` și `RentalsOutTab.tsx`:
- Subscribe la `postgres_changes` pe `rentals` filtrat pe `renter_id` / `owner_id`
- Invalidează `useQuery` keys la fiecare UPDATE → timeline se re-randează automat
- Bonus: subscribe pe `rental_inspections` pentru check-uri live

## Pages care primesc redesign

| Pagină | Schimbare |
|---|---|
| `RentalsPage.tsx` | Card per rezervare cu nou timeline + NextActionCard inline |
| `RentalsOutPage.tsx` | Idem, perspectivă owner |
| `RentalsTab.tsx` / `RentalsOutTab.tsx` | Filtre cu badge-uri colorate noi (7 statusuri), grid cards refăcute |
| `AcceptedRentalDialog.tsx` | Refactor: integrează NextActionCard + buton către InspectionWizard |
| Admin `AdminReservations.tsx` | Vizualizare timeline complet + galerie poze inspections + audit trail |

## Notificări

Existente (păstrate, doar adăugate triggere noi):
- Email + in-app la fiecare schimbare status
- Push (placeholder pentru viitor — Web Push API)

Triggere noi:
- „Proces verbal predare necesar" (când rental devine `în tranzit`)
- „Proces verbal retur necesar" (owner, când end_date a trecut)
- „Review reminder" (24h după finalizare)

## Securitate (out of scope acest sprint — listate ca follow-up)
2FA după 30 zile inactivitate, OTP email re-auth, device trust și suspicious login → recomand sprint separat (necesită infra auth schimbată).

## Detalii tehnice

**Fișiere create:**
- `src/components/dashboard/RentalTimelineV2.tsx`
- `src/components/dashboard/NextActionCard.tsx`
- `src/components/dashboard/inspection/InspectionWizard.tsx`
- `src/components/dashboard/inspection/StepIntro.tsx`
- `src/components/dashboard/inspection/StepPhotos.tsx`
- `src/components/dashboard/inspection/StepChecklist.tsx`
- `src/components/dashboard/inspection/StepNotes.tsx`
- `src/components/dashboard/inspection/StepDeclaration.tsx`
- `src/components/dashboard/inspection/StepConfirm.tsx`
- `src/components/dashboard/SupportFromRentalButton.tsx`
- `src/components/dashboard/ReviewPromptDialog.tsx`
- `src/hooks/useRentalRealtime.ts`

**Fișiere modificate:**
- `RentalTimeline.tsx` → marcat deprecated, redirectă la V2
- `RentalsTab.tsx`, `RentalsOutTab.tsx` → folosesc V2 + NextActionCard + realtime hook
- `AcceptedRentalDialog.tsx` → integrare wizard
- `InspectionDialog.tsx` → înlocuit de InspectionWizard
- `pages/admin/AdminReservations.tsx` → tab nou „Procese verbale"
- `data/uxCopy.ts` → texte noi RO/EN pentru 7 pași + next actions + wizard

**Fără schimbări:**
- Schema DB (folosim coloane existente)
- Edge functions
- Email templates (deja redesign-uite)
- Stripe flow

## Out of scope
- 2FA / OTP / device trust (sprint separat)
- Push notifications native
- Schimbare schemă inspections (folosim cea existentă)
