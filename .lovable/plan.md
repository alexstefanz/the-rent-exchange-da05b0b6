## Obiectiv

Refactorizam fluxul PV-urilor astfel incat fiecare PV sa fie completat (foto + semnatura prima) de o singura parte, iar cealalta parte doar aproba prin semnatura. Adaugam un pas explicit „Initiaza returnarea" pe care chiriasul il apasa inainte ca PV-ul de returnare sa devina disponibil.

## Fluxul nou (end-to-end)

1. **PV Predare (Proprietar → Chirias)**
   - Doar **proprietarul** poate urca fotografii (min. 2) si semneaza primul.
   - **Chiriasul** nu mai urca poze. Vede pozele facute de proprietar si semneaza pentru a confirma ca este de acord cu starea documentata.
   - Dupa ambele semnaturi → PDF generat automat (ca azi).

2. **Pasul 5 — „Preia produsul"** (deja exista, ramane neschimbat)
   - Chiriasul apasa „Am primit produsul" → `handover_confirmed_at = now()`, status `active`.

3. **Pasul 6 — „Produsul este in folosire / Initiaza returnarea"** (NOU)
   - Card vizibil dupa `handover_confirmed_at`, cat timp PV-ul de returnare nu e inceput.
   - **Chirias**: buton „Initiaza returnarea" → AlertDialog de confirmare („Dupa confirmare, vei fotografia produsul si vei completa procesul verbal de returnare.") → la confirmare se „deschide" PV-ul de returnare.
   - **Proprietar**: badge „Asteptam chiriasul sa initieze returnarea" + buton „Discuta in chat".

4. **PV Returnare (Chirias → Proprietar)**
   - Disponibil **doar** dupa ce chiriasul initiaza returnarea.
   - Doar **chiriasul** urca fotografii (min. 2) si semneaza primul.
   - **Proprietarul** vede pozele si semneaza pentru a aproba.

5. **Finalizare + review** (deja exista)
   - Dupa ambele semnaturi pe PV Returnare → status `completed`, ambele parti primesc CTA „Lasa un review" (LeaveReviewDialog deja implementat).

## Modificari tehnice

**Backend (o singura migrare):**
- RPC nou `initiate_return(_rental_id uuid)` `SECURITY DEFINER`:
  - Verifica `auth.uid() = renter_id`, `handover_confirmed_at IS NOT NULL`, `status = 'active'`.
  - Verifica ca nu exista deja `rental_pv_documents` cu `phase='return'`.
  - Face `INSERT INTO rental_pv_documents (rental_id, phase) VALUES (_rental_id, 'return')` — aceasta intrare „goala" e semnalul ca returnarea a fost initiata (zero schimbari de schema; nu adaugam coloana noua).
  - `GRANT EXECUTE ... TO authenticated`.

**Frontend:**

- `src/features/rentals/rentalDetailPageApi.ts`
  - Inlocuim `initiateReturn` actual (care setea `early_return_status`) cu apel la RPC-ul nou `supabase.rpc('initiate_return', { _rental_id })`.
  - Helper nou `getReturnInitiated(rentalId)` care verifica existenta rand-ului `rental_pv_documents` cu `phase='return'`.

- `src/components/rentals/PvSignatureDialog.tsx`
  - Determinam „uploaderul" in functie de faza: `uploaderRole = phase === 'handover' ? 'owner' : 'renter'`.
  - Doar `role === uploaderRole` poate adauga/sterge fotografii (input file dezactivat pentru celalalt).
  - Eliminam galeriile duale „Fotografii Proprietar" / „Fotografii Chirias" si afisam o singura galerie unificata cu titlu „Fotografii (proprietar/chirias)" + chip de rol.
  - Mesajul de „randul tau" se adapteaza: pentru cealalta parte: „Verifica fotografiile si semneaza pentru a aproba PV-ul".
  - PDF-ul ramane neschimbat — afiseaza pozele cu eticheta rolului uploader-ului (deja face asta).

- `src/pages/RentalDetailPage.tsx`
  - Adaugam query `useQuery` pentru `getReturnInitiated(rental.id)` → `returnInitiated`.
  - `showReturnPvEarly` devine: `isPaidEarly && stepEarly >= 3 && handoverDoneEarly && !!rental.handover_confirmed_at && returnInitiated`.
  - Adaugam card „Pasul 6 — Produsul este in folosire" vizibil cand: `handoverDoneEarly && rental.handover_confirmed_at && !returnInitiated && !returnDoneEarly && status NOT IN ('cancelled','completed')`.
    - Chirias: buton „Initiaza returnarea" → AlertDialog cu copy din imaginea 3 (titlu „Initiaza returnarea produsului", text „Dupa confirmare, vei fotografia produsul si vei completa procesul verbal de returnare.", actiuni „Renunta" / „Confirm returnarea") → `initiateReturn` → invalidate queries.
    - Proprietar: badge „Asteptam chiriasul sa initieze returnarea" + buton „Discuta in chat".
  - Dupa initiere, PvPanel-ul de returnare devine vizibil ca acum.

- `src/components/rentals/EarlyReturnCard.tsx`: neatins (pretul prorata pentru early return ramane logica separata, nu intra in conflict).

## Compatibilitate

- PV-uri vechi cu fotografii de la ambele parti raman lizibile (galeria unificata afiseaza toate pozele indiferent de rol).
- Rezervari deja in faza de returnare (cu `rental_pv_documents` `phase='return'` deja creat) sunt tratate ca „return initiated" — apar normal in noul flux, fara batuturi.
- Rezervarile in care chiriasul deja a urcat poze pe PV Predare raman valide; pozele continua sa apara in galeria unificata.

## Out of scope

- Notificari email/SMS pentru pasul „initiaza returnarea" (se pot adauga ulterior prin `notify-rental-event`).
- Schimbari pe `RentalTimeline` (etapele raman aceleasi).
- Schimbari pe PDF.
