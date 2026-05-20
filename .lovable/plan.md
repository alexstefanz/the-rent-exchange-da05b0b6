# Comasare pași 4 + 5 din timeline-ul rezervării

Momentan timeline-ul are 7 pași, dintre care doi sunt aproape duplicați: **Semnături PV** și **Produs predat**. Le unim într-un singur pas **„Predare produs"** care acoperă tot procesul de predare (semnare PV + confirmarea primirii de către chiriaș).

## Comportament nou

Timeline nou (6 pași):

```text
1. Cerere trimisă
2. Confirmat
3. Plată efectuată
4. Predare produs        ← pas combinat
5. Returnare
6. Finalizat
```

Pasul 4 „Predare produs":
- **Activ (portocaliu)** din momentul în care plata e autorizată și până când chiriașul confirmă primirea produsului.
- În interiorul pasului există în continuare două sub-acțiuni vizibile în card-ul de acțiune și în secțiunea „Procese verbale":
  1. Semnare PV de predare (de către ambele părți)
  2. După ce PV-ul e semnat de ambele părți, chiriașul vede butonul **„Confirmă primirea produsului"** (proprietarul vede stare „Așteptăm chiriașul să confirme primirea")
- **Bifat (verde)** doar după ce chiriașul a apăsat „Confirmă primirea" (adică `handover_confirmed_at` e setat). Abia atunci se deblochează pasul **Returnare**.

Toată logica existentă pentru semnarea PV-ului și pentru confirmarea primirii rămâne identică — singura schimbare e că în bara de stare apare un singur pas în loc de două.

## Modificări de cod

Doar prezentare (frontend). Fără migrații, fără edge functions, fără schimbări de business logic.

**`src/components/dashboard/RentalTimeline.tsx`**
- Elimin pasul `Produs predat` din `STEPS` (rămân 6 pași). Pictograma pasului combinat: `Package` (mai potrivită ca metaforă „predare").
- Actualizez `getTimelineStep`:
  - `return_pv_owner_signed` → step 6 (Finalizat)
  - `status === "completed" || return_confirmed_at` → step 6
  - `return_pv_renter_signed` sau `return_initiated` sau `handover_confirmed_at` sau `status === "active"` → step 5 (Returnare)
  - `payment_status` autorizat/plătit (cu sau fără PV semnat) → step 4 (Predare produs, activ)
  - restul rămâne la fel, doar renumerotare.
- Actualizez comentariul JSDoc cu noua listă de 6 pași.
- Etichete:
  - RO: „Predare produs" / scurt „Predare"
  - EN: „Handover" / scurt „Handover"

**`src/pages/RentalDetailPage.tsx`**
- Nicio schimbare de logică, doar verific că textele care fac referire explicită la „pasul 4/5" rămân coerente (ex. `Pasul 5 — Preia produsul` din captură). Le actualizez la `Pasul 4 — Predare produs` cu același conținut și același CTA „Confirmă primirea produsului" pentru chiriaș / status „Așteptăm confirmarea chiriașului" pentru proprietar.

**Fără modificări** în: `RentalsTab`, `RentalsOutTab`, `NextActionCard`, `MainActionCard`, edge functions, baza de date.

## Out of scope

- Nu modificăm fluxul de semnare PV.
- Nu schimbăm cine poate confirma primirea (rămâne doar chiriașul).
- Nu atingem pasul de Returnare / Finalizat.
