## Obiectiv
Când proprietarul modifică un anunț deja aprobat prin wizardul de editare (`/publica` în mod `edit`), anunțul revine la statusul `pending` și apare din nou în coada de aprobare a adminului — exact ca la prima publicare. Adminul vede modificările și le aprobă sau respinge.

## Comportament

- **Editare prin wizard (titlu, descriere, imagini, categorie, preț, locație, condiție, accesorii, reguli etc.)** → status devine `pending`, anunțul dispare din listările publice până la o nouă aprobare.
- **Acțiuni care NU declanșează re-aprobarea** (rămân instant):
  - Pornire/oprire anunț (`is_active` toggle din `/anunțuri`)
  - Modificare disponibilitate / date blocate din dialogul "Disponibilitate"
  - Ștergere / restore
- **Anunțuri respinse** continuă să se comporte ca azi (editare → `pending`, fără schimbare).
- **Anunțuri în `pending`** rămân `pending` (no-op).

## UX pentru proprietar

- Toast după salvare (în loc de "Anunț actualizat"):
  - RO: „Anunț retrimis spre aprobare — modificările vor fi vizibile după verificare (de obicei sub 2 ore)."
  - EN: „Listing resubmitted for approval — changes will be visible after review (usually under 2 hours)."
- Pe pagina `/anunțuri`, badge-ul de status va deveni automat „În așteptare" (folosește deja `approval_status`).
- Pe ecranul de Summary al wizardului (pasul 4), adăugăm un mic banner informativ înainte de butonul „Salvează modificările":
  - RO: „Orice modificare salvată va trimite anunțul din nou spre aprobare."
  - EN: „Saving any change will resubmit the listing for review."

## Detalii tehnice

Fișiere atinse:

1. **`src/features/products/productsApi.ts` → `updateProduct`**
   - Lângă logica existentă pentru `rejected`, adăugăm o ramură pentru `approved`:
     ```ts
     if (current?.approval_status === "approved") {
       payload.approval_status = "pending";
     }
     ```
   - Nu modificăm `is_active` (rămâne cum era setat de owner). Anunțul devine invizibil public pentru că filtrele publice cer `approval_status = 'approved'`.

2. **`src/components/publish/PublishWizard.tsx` → `handlePublish` (edit branch)**
   - Calculăm `willRequireReview = initialProduct?.approval_status === 'approved' || initialProduct?.approval_status === 'rejected'`.
   - Folosim mesajul de „retrimis spre aprobare" pentru ambele cazuri.
   - Pe pasul 4 (Summary), adăugăm banner informativ doar când `initialProduct?.approval_status === 'approved'`.

3. **Notificare admin** — nu e necesar cod nou: pagina `/admin/approvals` listează deja produsele cu `approval_status = 'pending'`, deci anunțul reapare automat acolo. (De confirmat rapid la implementare.)

## Out of scope

- Nu trimitem email/notificare admin separat pentru re-aprobări (folosește fluxul existent de „pending listings").
- Nu păstrăm un diff vizual al modificărilor pentru admin (poate fi un follow-up).
