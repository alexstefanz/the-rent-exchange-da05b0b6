## Confirmări Anunțuri — Buton "Previzualizează anunț"

### Scop
În `/admin/approvals`, pe fiecare card de anunț în așteptare, adaug un buton **„Previzualizează anunț"** înaintea butonului „Aprobă", astfel încât adminul să poată inspecta anunțul exact așa cum îl va vedea publicul, înainte de a lua o decizie.

### Comportament
- Butonul se deschide într-un **tab nou** (`target="_blank"` + `rel="noopener noreferrer"`) pentru a nu pierde lista de aprobări și starea de scroll.
- Link către `/produs/:slug` (ruta publică existentă). Dacă produsul nu are `slug`, fallback pe `/produs/{id}`.
- Stil: variant `outline` cu iconiță `Eye` din lucide-react, păstrând cele 12px border radius și paleta primary (#F59E0B) prin tokens semantici.
- Ordinea acțiunilor în card: **Previzualizează** → **Aprobă** → **Respinge**.
- Anunțurile pending sunt vizibile de admin pe pagina publică (RLS „Admins can view all products" e deja activ), deci preview-ul va încărca corect chiar dacă `approval_status = 'pending'`.

### Detalii tehnice
- Fișier modificat: `src/pages/admin/AdminApprovals.tsx`
  - Import `Eye` din `lucide-react`.
  - În blocul `{/* Actions */}` (în jurul liniei 309), inserez un `<Button asChild variant="outline">` cu un `<a>` către `/produs/${product.slug ?? product.id}` deschis în tab nou, plasat înainte de butonul „Aprobă".
- Fără modificări de logică/business, fără migrații, fără schimbări în `uxCopy.ts` (text scurt RO inline, în linie cu butoanele existente „Aprobă"/„Respinge" din aceeași pagină).
