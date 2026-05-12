## Imbunatatiri Proces Verbal & Timeline Returnare

### 1. Dialog PV (`PvSignatureDialog.tsx`) — buton fotografii vizibil + galerie editabila

**Buton "Adauga fotografii":**
- Inlocuieste link-ul subtil portocaliu cu un buton primary plin (variant `default`, marime `sm`), aliniat la dreapta, cu icon Camera. Devine actiunea evidenta a sectiunii.
- Adauga sub el un mesaj scurt de hint: "Min. 2 foto. Recomandat: produs general, accesorii, eventuale defecte."

**Separare fotografii pe rol (owner / renter):**
- Galeria se imparte in 2 sub-sectiuni clare:
  - "Fotografii Proprietar (n)" — fundal subtil + badge
  - "Fotografii Chirias (n)"  — fundal subtil + badge
- Fiecare miniatura afiseaza un mic chip in colt cu rolul si data uploadului.

**Stergere & reincarcare (galerie editabila):**
- Pe fiecare miniatura proprie (uploaded de tine), buton X (hover/tap) care sterge fotografia: scoate path-ul din BD si din storage. Nu poti sterge fotografiile celuilalt.
- Stergerea/uploadul sunt permise atata timp cat **propria semnatura nu este aplicata inca** (`mySigned === false`). Dupa semnare, doar vizualizare.
- Click pe miniatura -> lightbox fullscreen cu navigare stanga/dreapta intre toate fotografiile.

**Validare semnare:**
- Conditia minim 2 foto se calculeaza pe **totalul ambelor sectiuni** (cum e si acum), nu per rol.

### 2. Tracking per-uploader in baza de date

Migrare noua:
- Adauga coloana `photos_meta jsonb not null default '[]'::jsonb` pe `rental_pv_documents`. Format: `[{ "path": "...", "role": "owner"|"renter", "uploaded_at": "iso" }]`.
- Backfill: pentru randuri existente, populez `photos_meta` din `photos` marcand toate ca `role = owner` (fallback rezonabil pentru istoricul scurt; alternativ atribuim dupa cine a semnat primul). 
- Pastrez coloana `photos text[]` sincronizata (o derivam din `photos_meta`) pentru compatibilitate cu generarea PDF si alte locuri care o citesc.
- Update RLS: existent ramane (acelasi rental_id, party access).

API (`rentalDetailPageApi.ts`):
- `upsertPvPhotos` devine `addPvPhoto({ rentalId, phase, role, path })` si `removePvPhoto({ rentalId, phase, path })` — actualizeaza `photos_meta` si `photos` atomic.
- Deletion sterge si fisierul din bucket-ul `rental-pvs`.

### 3. Timeline (`RentalTimeline.tsx`) — pasii Returnare & Finalizat din PV

Adaug in `RentalForTimeline`:
- `return_pv_renter_signed?: boolean`
- `return_pv_owner_signed?: boolean`

Logica `getTimelineStep` actualizata (peste cea existenta):
- Daca `return_pv_owner_signed` -> step 7 (Finalizat).
- Daca `return_pv_renter_signed` -> step 6 (Returnare deblocat).
- Restul cazurilor (return_initiated, handover, etc.) raman cum sunt.

In `RentalDetailPage.tsx` populez aceste flag-uri din `rental.return_pv_owner_signed_at` / `rental.return_pv_renter_signed_at` in obiectul `tlRental`.

### 4. Auto-finalizare la semnatura proprietarului (Returnare)

Cand proprietarul semneaza PV-ul de returnare:
- Trigger DB pe `rental_pv_documents` (after update, when `phase = 'return'` AND `owner_signed_at` becomes not null):
  - Setez pe `rentals`: `return_confirmed_at = now()`, `status = 'completed'`, `completed_at = now()` (daca nu sunt deja).
  - Pastrez logica existenta de capture/payout (declansata deja prin alte triggere/edge functions pe `return_confirmed_at`/`status='completed'` — verific si nu duplic).
- Similar, pe semnarea renter-ului PV de returnare, setez `early_return_status = 'initiated'` daca nu e deja, ca step-ul 6 sa fie consistent si pentru clientii fara realtime.

### Out of scope
- Nu modific fluxul de plata, capture sau payout.
- Nu schimb generarea PDF-ului (foloseste in continuare `photos`).
- Nu ating PV de Predare logic — doar UI-ul (buton + separare + stergere) este partajat prin acelasi dialog.

### Fisiere atinse
- `src/components/rentals/PvSignatureDialog.tsx` (UI buton, sectiuni per rol, stergere, lightbox)
- `src/features/rentals/rentalDetailPageApi.ts` (add/remove photo, types `PvDocument.photos_meta`)
- `src/components/dashboard/RentalTimeline.tsx` (flags noi + reguli)
- `src/pages/RentalDetailPage.tsx` (populez flag-urile noi)
- Migrare noua: coloana `photos_meta` + trigger auto-finalizare returnare
