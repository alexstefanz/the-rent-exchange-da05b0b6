## Reorganizare PV: card full-width sub timeline + flux secvential

### 1. Layout — card PV full-width sub timeline (`RentalDetailPage.tsx`)

- Scot `<section>` cu PV-urile din coloana de stanga (din grid-ul `lg:grid-cols-3`).
- Mut sectiunea direct sub `<RentalTimeline>`, ca un card proeminent care ocupa intreaga latime a containerului (acelasi `max-w-5xl` ca timeline-ul).
- Cardul devine vizibil tot timpul cand `step >= 3` (PV Predare) si `step >= 5` (PV Returnare apare incremental).
- In interiorul cardului: header "Procese verbale" + 2 panouri (Predare / Returnare), fiecare panou afisand:
  - status compact: "Proprietar: semnat / in asteptare / blocat" si "Chirias: semnat / in asteptare / blocat".
  - eticheta pasului curent ("Randul tau", "Asteptam proprietarul", "Asteptam chiriasul", "Finalizat").
  - buton primary "Deschide proces verbal" — activ doar pentru rolul caruia ii vine randul; disabled cu tooltip cand este blocat.

Restul paginii ramane pe grid 2/3 + 1/3 (Produs, Counterparty, Detalii plata stanga; Sumar financiar dreapta).

### 2. Flux secvential PV (`PvSignatureDialog.tsx`)

Reguli noi (in plus fata de cele actuale):

**Predare (handover):**
1. Proprietarul deschide PV: poate adauga/sterge fotografii proprii si semneaza primul.
2. Pana cand `owner_signed_at` nu este setat:
   - Pentru `role === "renter"`: dialogul afiseaza un panou de blocare "Asteapta proprietarul sa completeze PV-ul de Predare" (fara upload, fara semnatura).
3. Dupa ce proprietarul semneaza:
   - Chiriasul poate adauga propriile fotografii (in sectiunea "Fotografii Chirias") si semneaza.
4. Cand ambele semnaturi exista → `handover_confirmed_at = now()` automat (trigger nou) → timeline-ul trece la pasul 5 (Produs predat).

**Returnare (return):**
1. Chiriasul deschide PV de Returnare primul: adauga fotografii proprii si semneaza. La semnatura lui:
   - `early_return_status = 'initiated'` (deja exista in trigger), iar timeline-ul trece la pasul 6 (Returnare). 
2. Pana cand `renter_signed_at` (faza return) nu este setat:
   - Pentru `role === "owner"`: panou de blocare "Asteapta chiriasul sa initieze returnarea si sa semneze PV-ul".
3. Dupa ce chiriasul semneaza:
   - Proprietarul poate adauga fotografii si semna. La semnatura sa: `return_confirmed_at = now()`, `status = 'completed'` (trigger existent) → pasul 7 (Finalizat).

Implementare in dialog:
- Adaug `firstSigner: "owner" | "renter"` derivat din `phase` (`handover` → owner, `return` → renter).
- `isMyTurn = role === firstSigner ? !mySigned : (otherSigned && !mySigned)`.
- Daca `!isMyTurn && !mySigned`: ascund upload-ul propriu, ascund signature pad si afisez un alert clar (icon Lock + mesaj contextual + buton "Inchide"). Galeria celuilalt rol ramane vizibila read-only.
- Buton "Adauga fotografii": disabled cand nu e randul tau (sau cand `mySigned`).
- Buton "Semneaza": disabled cand nu e randul tau.

### 3. Auto-avansare timeline la semnaturi (DB)

Migrare noua, completare la trigger-ul existent `tg_pv_*`:
- Pe `rental_pv_documents` AFTER UPDATE:
  - Daca `phase = 'handover'` si **ambele** `owner_signed_at` si `renter_signed_at` sunt not null si `rentals.handover_confirmed_at IS NULL` → setez `handover_confirmed_at = now()` si `status = 'active'` (daca nu e deja). Asa pasul 5 (Produs predat) se aprinde automat.
  - Logica existenta pentru Returnare ramane (`renter_signed_at` → `early_return_status='initiated'`; `owner_signed_at` → `status='completed'`, `return_confirmed_at`, `completed_at`).

### 4. Timeline `RentalTimeline.tsx` — fara schimbari functionale

Logica `getTimelineStep` deja suporta noile flag-uri (`handover_pv_signed`, `return_pv_renter_signed`, `return_pv_owner_signed`). Dupa trigger-ul de mai sus, pasul 5 va fi atins automat la a doua semnatura din Predare prin `handover_confirmed_at`.

### Fisiere atinse

- `src/pages/RentalDetailPage.tsx` — relocare card PV full-width sub timeline; eliminare PvRow vechi inline; folosire panouri noi cu eticheta de "randul cui e".
- `src/components/rentals/PvSignatureDialog.tsx` — gating secvential (panou de blocare cand nu e randul tau, dezactivare upload + signature pad).
- Migrare noua: extensie trigger `tg_pv_handover_progress` care seteaza `handover_confirmed_at` cand ambele semnaturi de Predare exista.

### Out of scope

- Nu modific generarea PDF, capture-ul Stripe sau payout-ul.
- Nu schimb logica pentru fluxurile de cancel/refuz/dispute.
- Pastrez minimul de 2 fotografii / total per PV.
