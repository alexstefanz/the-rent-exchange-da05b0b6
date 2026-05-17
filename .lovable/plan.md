## Problema

PV-urile semnate de ambele părți după noul template ar trebui să arate un buton **„Vezi PV semnat (PDF)"** și să genereze automat fișierul PDF cu noul format. În screenshot, după ce ambele părți au semnat (17.05.2026 11:42), butonul portocaliu de PDF lipsește din dialog.

Cauze identificate în `src/components/rentals/PvSignatureDialog.tsx`:

1. **`generatePdf` poate eșua silențios** — operația include fetch-uri către storage pentru fiecare poză, `new Image()` async și `doc.addImage`. Orice excepție (CORS, imagine corruptă, FileReader fail) este prinsă de `try/catch` din `handleSign` și se afișează doar `toast.error` generic. Semnătura rămâne salvată, dar `pdf_path` rămâne `null` → la următoarea deschidere a dialogului nu apare butonul PDF.
2. **Nu există o cale de recuperare** — odată ce ambii au semnat și PDF-ul a eșuat, nu se poate reîncerca generarea. PV-urile vechi (semnate înainte de noul template) au PDF generat cu vechiul layout și nu pot fi reîmprospătate.
3. **Refresh după semnare** — în `handleSign`, după ce se salvează `pdfPath`, nu se face `setPv(...)` cu noul rând, deci dacă utilizatorul nu închide dialogul, butonul tot nu apare.

## Soluție

Modific doar `src/components/rentals/PvSignatureDialog.tsx`:

1. **Buton „Regenereaza PDF"** vizibil oricui când `pv.owner_signed_at && pv.renter_signed_at` (indiferent dacă `pdf_path` există), poziționat lângă/peste butonul existent „Vezi PV semnat (PDF)". Acțiunea:
   - apelează `generatePdf(pv)` → `uploadPvPdf(blob, ...)` → `savePvSignatureAndPdf({ pdfPath })` (folosind semnătura existentă a utilizatorului curent, fără a re-suprascrie semnătura celuilalt — adaug `signatureDataUrl` opțional în `savePvSignatureAndPdf` sau, mai curat, fac un mic helper care actualizează direct `pdf_path` + `generated_at` fără să atingă semnăturile).
   - toast success + `setPv(refreshed)`.

2. **Helper nou `updatePvPdfPath(rentalId, phase, pdfPath)`** în `src/features/rentals/rentalDetailPageApi.ts` care face doar `update({ pdf_path, generated_at })` — evită cerința de `signatureDataUrl` din `savePvSignatureAndPdf` la regenerare.

3. **Hardening la `generatePdf`**:
   - dacă `rental.start_date`/`end_date` lipsesc → folosesc fallback `-`.
   - try/catch în jurul fetch-ului fiecărei imagini (deja există), dar și în jurul `new Image()` cu timeout 8s.
   - log explicit în consolă cu motivul eșuării.

4. **Mesaj de eroare detaliat în `handleSign`** — `toast.error("PDF: " + (e?.message || "eroare necunoscuta"))` în loc de generic.

5. **Refresh `pv` după generarea PDF-ului în `handleSign`** — apel `getPvDocument` și `setPv(...)` înainte de `onOpenChange(false)`, ca să vadă imediat butonul dacă ar redeschide.

Nu se modifică schema bazei de date, RLS sau edge functions.

## Detalii tehnice

```text
PvSignatureDialog
 ├── handleSign (existent)
 │    ├── savePvSignatureAndPdf (semnătură)
 │    ├── dacă ambii semnati:
 │    │     generatePdf → uploadPvPdf → updatePvPdfPath
 │    │     setPv(refreshed)
 │    └── toast.error("PDF: <motiv>") la fail
 └── handleRegeneratePdf (nou)
      generatePdf → uploadPvPdf → updatePvPdfPath
      setPv(refreshed)
      toast.success("PDF regenerat")
```

Buton nou redat doar când `pv.owner_signed_at && pv.renter_signed_at`, deasupra/sub butonul portocaliu de vizualizare. Dacă `pdf_path` lipsește, butonul portocaliu nu apare iar cel de regenerare devine principalul CTA.