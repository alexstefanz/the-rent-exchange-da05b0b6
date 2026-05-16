# PV: buton vizibil + poze în PDF

Două schimbări în `src/components/rentals/PvSignatureDialog.tsx`.

## 1. Buton „Vezi PDF generat" mai vizibil

Acum este un `variant="link"` mic ascuns în secțiunea de status. Îl scoatem într-un card propriu, full-width, cu accent portocaliu (brand `#F59E0B` / hover `#F98715`), iconiță `FileText` + `ExternalLink`, deasupra secțiunii de status, vizibil doar când `pv?.pdf_path` există:

- `Button` mărime default, `w-full`
- fundal `bg-[#F59E0B] hover:bg-[#F98715] text-white`
- text: „Vezi PV semnat (PDF)" + iconiță
- subtext mic: „Document semnat de ambele părți"

Linkul vechi din blocul de status este eliminat ca să nu se dubleze.

## 2. Fotografiile în PDF

Funcția `generatePdf(updatedPv)` actualmente scrie doar numărul de poze. O extindem să atașeze imaginile real:

- După secțiunea „Fotografii anexate", pentru fiecare intrare din `updatedPv.photos` (sau `photos_meta`):
  1. obține URL semnat cu `getPvFileSignedUrl(path)`
  2. fetch → blob → `FileReader` → dataURL
  3. determinăm dimensiunile cu un `Image()` temporar ca să păstrăm aspect ratio
  4. `doc.addImage(dataUrl, "JPEG", x, y, w, h)` într-un grid 2 coloane, fiecare poză max ~240×180 pt
  5. sub fiecare poză etichetă mică: „Proprietar" / „Chirias" + data upload (din `photos_meta`)
  6. `doc.addPage()` automat când `y + h` depășește înălțimea paginii; resetăm `y` la 50

- După grilă, lăsăm spațiu și continuăm cu textul introductiv + semnături existente (mutăm semnăturile pe pagină nouă dacă nu mai încap, prin verificare `y > pageHeight - 200 → addPage()`).

Folosim doar API-uri deja importate (`jsPDF`, `getPvFileSignedUrl`) — fără dependențe noi. Funcția devine `async` (deja este) și încărcăm pozele în paralel cu `Promise.all` pentru viteză.

## Detalii tehnice

- Fișier modificat: `src/components/rentals/PvSignatureDialog.tsx`
- Importuri noi din `lucide-react`: `FileText`, `ExternalLink`
- Helper local `fetchAsDataUrl(url)` + `loadImageSize(dataUrl)` (în același fișier, înainte de `generatePdf`)
- Erori la o poză individuală sunt prinse cu try/catch și sărim peste poza respectivă (nu blocăm PDF-ul)
- Regenerarea PDF-ului se face automat la următoarea semnătură; PV-urile deja semnate vor primi poze doar dacă cineva re-semnează — acceptăm acest comportament (nu adăugăm buton „regenerează")

## Out of scope

- Nu modificăm RLS sau storage policies (`getPvFileSignedUrl` deja funcționează)
- Nu schimbăm layout-ul cardurilor de fotografii din dialog
- Nu adăugăm OCR/compresie suplimentară — pozele sunt deja optimizate la upload
