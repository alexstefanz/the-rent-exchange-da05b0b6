## Produsele mele — Preview pentru anunțuri în așteptare

### Scop
În `/owner/listings` (componenta `LendingsTab`), când un produs are `approval_status = 'pending'`, proprietarul vede:
- Un **badge „În așteptare"** (galben), nu „Inactiv".
- Un buton vizibil **„Previzualizează anunț"** (icon `Eye` + text), care deschide pagina publică `/produs/:slug` într-un tab nou — exact așa cum o va vedea publicul după aprobare.

Astfel, până ce adminul aprobă, owner-ul poate vedea instant cum arată anunțul real.

### Comportament
- Logică status badge:
  - `approval_status === 'rejected'` → badge `rejected` („Respins").
  - `approval_status === 'pending'` → badge `pending` („În așteptare").
  - altfel → `active` / `inactive` în funcție de `is_active` (comportament actual).
- Pentru produse **pending**: buton dedicat „Previzualizează anunț" (variant `outline`, full text) lângă butonul Edit. Iconița Eye standalone se ascunde pentru pending (este înlocuită de butonul cu text). Pentru celelalte stări rămâne iconița Eye actuală.
- Preview-ul deschide ruta `/produs/${product.slug ?? product.id}` cu `target="_blank"` + `rel="noopener noreferrer"`. RLS „Owners can view their own products" permite owner-ului să citească produse pending, deci pagina se va încărca corect.

### Detalii tehnice
- Fișier modificat: `src/components/dashboard/LendingsTab.tsx`
  - Calculez `derivedStatus` per produs (`pending` | `rejected` | `active` | `inactive`).
  - Pasez statusul derivat lui `StatusBadge` (suportă deja `pending`/`rejected`).
  - Render condițional buton: pending ⇒ `<Button variant="outline" asChild><a href={...} target="_blank" rel="noopener noreferrer">Previzualizează anunț</a></Button>`; restul ⇒ icon Eye actual.
- Fișier modificat: `src/data/uxCopy.ts`
  - Adaug cheie `dashboard.previewListing` = `{ ro: "Previzualizează anunț", en: "Preview listing" }` pentru consistență bilingvă.
- Fără migrații, fără modificări de business logic, fără modificări la `StatusBadge` (etichetele „pending"/„rejected" există deja în `uxCopy.status`).
