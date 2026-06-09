## Cauza duplicării

**1. "Cererea ta de închiriere a fost acceptată!"** (2 emailuri)
- `respond-rental-request` (când proprietarul acceptă) → trimite eveniment `request_accepted` → email `rental-accepted`
- `verify-stripe-payment` (când se confirmă plata, imediat după) → trimite eveniment `payment_succeeded` → tot template-ul `rental-accepted`

Practic, fiecare cerere acceptată generează 2 emailuri aproape simultane cu același subiect și conținut.

**2. "Predarea a fost confirmată"** (2 emailuri)
- `PvSignatureDialog.handleSign` — când ambele părți au semnat PV-ul, frontend invocă `notify-rental-event` cu `handover_confirmed` (#1)
- `rentalDetailPageApi.confirmHandoverReceived` — când chiriașul apasă apoi "Confirm primirea", RPC-ul setează `handover_confirmed_at` și frontend mai invocă `notify-rental-event` cu `handover_confirmed` (#2)

## Plan de reparare

### Email "rental-accepted" — un singur trimis per cerere
În `supabase/functions/notify-rental-event/index.ts`, în config-ul evenimentului `payment_succeeded`:
- Scot template-ul email (`emailTemplate`) — păstrez doar notificarea in-app + SMS pentru proprietar
- Subiect in-app rămâne "Plata a fost confirmată" (util pentru proprietar care vede astfel că banii sunt blocați)
- Emailul "Cererea ta a fost acceptată" rămâne doar pe `request_accepted`

Avantaje:
- Chiriașul primește un singur email cu titlul corect
- Proprietarul vede separat in-app că plata e ok, fără email duplicat

### Email "handover-confirmed" — un singur trimis per predare
În `src/components/rentals/PvSignatureDialog.tsx`, în `handleSign`:
- Scot blocul care invocă `notify-rental-event` cu `handover_confirmed` (liniile ~276–281)
- Păstrez doar evenimentul `pv_pickup_completed_by_party` (notifică cealaltă parte că PV-ul a fost semnat)

Astfel emailul `handover-confirmed` rămâne trimis exclusiv de `confirmHandoverReceived` (când chiriașul confirmă fizic primirea — momentul real în care închirierea devine activă).

### Verificare
După deploy:
- `notify-rental-event` + redeploy
- Test: accept o cerere → 1 singur email "Cererea acceptată"
- Test: semnez PV ambele părți + confirm primirea → 1 singur email "Predarea confirmată"

## Fișiere modificate
- `supabase/functions/notify-rental-event/index.ts` — scot `emailTemplate` din `payment_succeeded`
- `src/components/rentals/PvSignatureDialog.tsx` — elimin invocarea `handover_confirmed` din `handleSign`
