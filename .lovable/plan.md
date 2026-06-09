## Problema

În screenshot-uri apar 3 simptome:
1. **Toast-uri cu fundal transparent și text negru** (ex. „Returnarea a fost initiata", „Te rugam sa semnezi in caseta") — vin de la `toast.success/error` direct din `sonner`. `src/components/ui/sonner.tsx` forțează `bg-transparent border-0 shadow-none p-0` pe toate toast-urile default, deci orice apel direct `toast.success(...)` apare gol.
2. **Duplicări** (un card portocaliu/verde stilizat + un toast transparent lângă) — codul cheamă atât `notify.*` (card custom) cât și `toast.error(...)` brut, sau `useToast` legacy în paralel cu sonner. În plus, `<Toaster />` legacy din `src/App.tsx` randează un al doilea sistem.
3. **Mesaje tehnice brute** propagate din DB / RPC:
   - `record "new" has no field "deposit_amount"`
   - `Owners can only set rental status to cancelled from the client (got: completed)`
   - `PDF: Owner signature is already captured and cannot be modified`

## Plan

### 1. Un singur sistem de notificări: card-ul `notify`
- Înlocuiește în `src/hooks/use-toast.ts` implementarea legacy cu un thin wrapper peste `notify` (`notify.success/error/info`). Astfel cele ~30 de fișiere care folosesc `useToast` rămân funcționale, dar randează card-ul corect.
- Scoate `<Toaster />` (legacy shadcn) din `src/App.tsx`. Păstrăm doar `<Sonner />`.
- Hardening în `src/components/ui/sonner.tsx`: păstrăm overrides existente (notify.tsx folosește `toast.custom`), dar adăugăm un fallback minim — dacă cineva mai cheamă direct `toast.success(...)`, să apară tot un card stilizat (nu transparent). Practic forțăm orice `toast.success/error/...` să treacă prin `notify` printr-un patch în `notify.ts` și descurajăm folosirea directă.

### 2. Migrare apeluri directe `toast.*` → `notify.*`
Înlocuiri în fișierele afectate de screenshot-uri:
- `src/pages/RentalDetailPage.tsx`:
  - `toast.success("Returnarea a fost initiata.")` → `notify.confirmation({ title: "Returnare inițiată", message: "Procesul de returnare a fost pornit." })`
  - `toast.error(...)` → `notify.error(friendly(e))`
- `src/components/rentals/PvSignatureDialog.tsx`:
  - „Te rugam sa semnezi in caseta" → `notify.warning({ title: "Semnătură lipsă", message: "Te rugăm să semnezi în casetă." })`
  - Erorile PDF/DOCX/semnare → `notify.error(...)` cu mesaj prietenos
  - **Suprimă** toast-ul `"PDF: ..."` dacă mesajul conține `Owner signature is already captured` — semnătura există deja, succesul real e afișat oricum.
- Restul fișierelor care fac `toast.success/error/...` direct din `sonner` se vor remedia implicit prin pasul 1 (sonner.tsx + wrapper), nu modificăm fiecare call site dacă nu e necesar pentru claritate.

### 3. Traducere erori brute → mesaje prietenoase
Adaugă în `src/lib/errorHandler.ts` (sau un mic util nou `friendlyRpcError`) mapări pentru pattern-urile observate:
- `has no field "deposit_amount"` → „Nu s-au putut salva sumele. Încearcă din nou peste câteva secunde sau contactează suportul." (+ log în consolă cu eroarea reală)
- `Owners can only set rental status to cancelled` → suprimă silent dacă acțiunea curentă nu e o anulare (e o eroare colaterală a unui trigger ce rulează după ce predarea s-a făcut deja); altfel afișează „Nu poți modifica statusul închirierii din acest ecran."
- `Owner signature is already captured` → suprimă (semnătura există deja, e no-op).

Aceste mapări sunt aplicate într-un helper `notifyError(e)` care decide:
1. dacă mesajul e în lista „suprimă" → doar `console.warn` și return,
2. dacă are mapare prietenoasă → `notify.error({ title, message })`,
3. fallback → `notify.error({ title: "Ceva nu a mers", message: getSecureErrorMessage(e) })`.

Înlocuim apelurile critice din PV / Rental detail / Listings cu `notifyError(e)`.

### 4. Verificare
- Re-test fluxul: inițiere returnare → 1 singur card verde, fără text transparent dedesubt.
- Semnează PV fără a desena → 1 singur card amber „Semnătură lipsă".
- Semnătură deja existentă → niciun toast tehnic, doar card-ul de succes „Închirierea... a fost finalizată".

## Fișiere modificate
- `src/App.tsx` (scoate `<Toaster />` legacy)
- `src/hooks/use-toast.ts` (bridge spre `notify`)
- `src/lib/notify.tsx` (adaugă `notify.warning` fallback dacă lipsește + helper `notifyError`)
- `src/lib/errorHandler.ts` (mapări mesaje prietenoase + lista de suprimat)
- `src/components/ui/sonner.tsx` (stil fallback lizibil pentru orice toast direct)
- `src/pages/RentalDetailPage.tsx`
- `src/components/rentals/PvSignatureDialog.tsx`

## Out of scope
- Nu migrăm acum toate cele ~30 de fișiere care folosesc `useToast` — pasul 1 le rezolvă automat. Le putem curăța într-un follow-up.
- Nu modificăm trigger-ele SQL care emit erorile brute (sunt protecții legitime); doar le traducem în UI.
