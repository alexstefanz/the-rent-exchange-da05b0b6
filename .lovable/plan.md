## Problem

Un anunț **Respins** poate fi editat din `/anunțuri`, dar la apăsarea butonului „Publică":
- `updateProduct` salvează modificările păstrând `approval_status = 'rejected'` și `is_active = false`
- Anunțul rămâne respins, nu se retrimite la moderare → utilizatorul nu vede nimic schimbat și pleacă confuz

## Soluție

La salvarea unui anunț **respins** din modul `edit`, retrimite automat anunțul la verificare (status `pending`) și anunță clar utilizatorul.

### 1. `src/features/products/productsApi.ts` — `updateProduct`
- Înainte de update, citește `approval_status` și `flag_reason` curente
- Dacă produsul era `rejected`:
  - Adaugă în payload: `approval_status: 'pending'`, `flag_reason: null`, `is_active: true` (ca să intre din nou în coada de aprobare)
  - Returnează un flag `resubmitted: true` (sau folosește produsul returnat care va avea noul status)
- Restul cazurilor rămân neschimbate (un anunț approved editat rămâne approved — nu schimbăm fluxul existent)

### 2. `src/components/publish/PublishWizard.tsx` — `handlePublish`
- După `updateProduct`, dacă produsul rezultat are `approval_status === 'pending'` și înainte era `rejected` (folosim `initialProduct.approval_status === 'rejected'`):
  - Toast: „Anunț retrimis spre aprobare — îl vei vedea publicat după verificare (de obicei sub 2 ore)."
- Altfel păstrăm toast-ul existent „Anunț actualizat"

### 3. `src/components/listings/ListingCard.tsx` — UX clarificare
- Pe cardul `rejected`, schimbă eticheta butonului principal din „Editează" în **„Editează & retrimite"** și actualizează tooltipul „Anunț respins — editează pentru retrimitere la verificare"
- (Comportamentul existent — link spre `/owner/edit-product/{id}` — rămâne)

### Decizie: editare permisă sau blocată?

Mențin **editarea permisă** (varianta a 2-a propusă de tine): e flow-ul natural — utilizatorul corectează motivul respingerii și retrimite. Blocarea editării ar bloca și republicarea. În schimb, UI-ul comunică explicit că salvarea = retrimitere la moderare.

### Out of scope

- Fără modificări de DB / RLS (update-ul de `approval_status` de către owner e deja permis de RLS-ul existent, la fel ca la creare)
- Fără email/notificare nouă către admin — folosim aceleași triggere ca la prima creare (dacă există deja notificare pentru `pending` o vom vedea funcționând; dacă nu, e o îmbunătățire separată)
- Fără schimbări în fluxul admin de aprobare
