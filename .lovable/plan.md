## Obiectiv

Pe pagina rezervării (`/inchirieri/:RNT-...` și `/rezervari/:RNT-...`), ambele părți să vadă clar care e **următorul pas**: PV Predare sau PV Returnare. Cardul activ se evidențiază vizual; cel ce încă nu se poate semna rămâne **vizibil dar inactiv** (fără să dispară).

## Logică „pasul curent"

În `RentalDetailPage.tsx`, deja se calculează:
- `handoverDoneEarly` = ambele semnături la PV Predare aplicate.
- `returnDone` = ambele semnături la PV Returnare aplicate (de adăugat).

Definim, pentru fiecare card PV:

- `isCurrentStep`:
  - **PV Predare** → `isPaid && !handoverDoneEarly`
  - **PV Returnare** → `handoverDoneEarly && !returnDone`
- `notStarted` (păstrat):
  - PV Returnare → `!handoverDoneEarly`
  - PV Predare → `false` (devine activ imediat după plată)

Doar **un** card poate fi `isCurrentStep` la un moment dat.

## Modificări UI în `PvPanel`

Fișier: `src/pages/RentalDetailPage.tsx` (componenta `PvPanel` + locul unde e instanțiată).

1. Prop nou `isCurrentStep: boolean`.
2. Când `isCurrentStep === true`:
   - Container card: `border-2 border-primary bg-primary/5 ring-2 ring-primary/15 shadow-sm`.
   - Badge mic în colțul dreapta-sus: `Pasul urmator` / `Next step` (pill portocaliu, `bg-primary text-primary-foreground`).
   - Icon container header devine `bg-primary/15`.
3. Mesaj de status mai explicit pentru cei „blocați" (când e tura celeilalte părți, dar pasul e activ):
   - Proprietar la PV Predare când are `isMyTurn` → text actual „Randul tau — completeaza si semneaza" (rămâne, dar cu accent vizual prin `isCurrentStep`).
   - Chiriaș la PV Predare (locked) → înlocuim „Asteptam proprietarul" cu un mesaj direcționat: „Proprietarul trebuie sa completeze si sa semneze PV Predare. Vei putea semna imediat dupa." / „Owner must complete and sign the Handover PV first. You'll be able to sign right after."
   - Simetric pentru PV Returnare (chiriașul semnează primul).
4. Când `notStarted === true` (PV Returnare înainte de predare): card rămâne ca acum, mut/gri, cu mesaj „Disponibil dupa predarea produsului" — fără highlight.
5. Restul stărilor (semnat parțial, finalizat, etc.) rămân neschimbate.

## Modificări în secțiunea „Procese verbale"

- Calculăm `returnDone = !!(rental.return_pv_owner_signed_at && rental.return_pv_renter_signed_at)`.
- Pasăm `isCurrentStep` la fiecare `<PvPanel />`:
  - Predare: `isPaidEarly && !handoverDoneEarly`
  - Returnare: `handoverDoneEarly && !returnDone`

## Out of scope

- Nu schimbăm timeline-ul de sus, fluxul de semnare propriu-zis sau permisiunile RLS — doar prezentarea vizuală și textele de status pe cardurile PV.
