## Problemă
PDF-ul (jsPDF) și DOCX-ul (docx-js) descărcate arată diferit față de procesul-verbal afișat în dialog:
- nu există logo Rentli în PDF, layout-ul antetului e diferit (centrare/font/spațiere)
- intro + obiectul închirierii sunt scrise ca text neformatat — în UI sunt fraze cu cuvinte cheie **bold** (numele părților, CNP, CI, adresă, telefon, email, denumire produs, categorie, zile, total, preț/zi, garanție)
- clauza finală nu e italicizată / muted ca în UI
- pozele nu sunt aliniate în grid 2 coloane în DOCX (sunt una sub alta)
- semnăturile au layout/font diferit (etichetă, nume, semnătură, linie, „Semnat …" muted) — vrem să arate ca în UI
- PDF-ul nu păstrează ordinea „header → hr → titlu → 6 paragrafe → poze → semnături → footer cod RNT"

Vrem ca cele 3 randări (dialog HTML, PDF, DOCX) să fie cât mai aproape vizual una de alta.

## Plan

### 1. `src/lib/pvContent.ts` — sursă unică de adevăr pentru conținutul „rich"
Adăugăm o funcție nouă `buildPvRichContent(rental, phase)` care întoarce, pe lângă stringurile actuale, și **runs structurate** — fragmente `{ text, bold? }` — pentru:
- `introRuns` (intro cu bold pe nume, „Predator (proprietar)", CNP, „CI seria X nr Y", adresă, telefon, email pentru ambele părți)
- `objectRuns` (obiectul închirierii cu bold pe denumire produs, categorie, „N zile", „X lei", „Y lei/zi", „Z lei" garanție)
- `accessoriesRuns` (opțional)
- `periodRuns`, `responsibilityRuns`, `finalClauseRuns`

Folosim aceste runs și în JSX-ul din dialog ca să garantăm că cele 3 formate au exact aceleași porțiuni bold (refactor minor în `PvSignatureDialog.tsx` — înlocuim porțiunile hardcodate cu un helper `<RichLine runs=… />`).

### 2. `src/lib/pvDocx.ts` — aliniere vizuală cu dialogul
- Păstrăm logo Rentli centrat (există).
- Antet: nume firmă bold 12pt, apoi 3 rânduri 9pt color `#6B7280` (muted), urmat de o linie orizontală subțire (paragraph cu `border.bottom` color `#E5E7EB`).
- Titlu: centrat, bold, 14pt, spațiere consistentă.
- Construim cele 6 paragrafe din `…Runs` cu `TextRun({ bold })` per fragment, aliniere `JUSTIFIED`, font Arial 11pt.
- Clauza finală: italică, 10pt, color `#6B7280`, separată de spațiere mai mare.
- Poze: secțiunea cu header bold „FOTOGRAFII LA …", apoi un `Table` cu N/2 rânduri × 2 celule (fără border vizibil) — fiecare celulă conține poza centrată la 260×180 + caption „Poza N" sub ea. Asta înlocuiește lista verticală actuală.
- Semnături: tabelul existent rămâne cu 2 coloane, dar layout-ul în celulă devine identic cu UI — label bold mic, nume, semnătură 180×60 sau text italic „— nesemnat —", apoi o linie subțire (`border.bottom`), apoi „Semnat dd.MM.yyyy HH:mm" muted 9pt.
- Footer: cod închiriere + „Generat: …" 8pt muted (există).

### 3. `src/components/rentals/PvSignatureDialog.tsx` — generator PDF aliniat
Refactorizăm `generatePdf(updatedPv)`:
- Încărcăm logo-ul Rentli (`@/assets/rentli_logo.png` → dataURL) și îl desenăm centrat sus (~120×40).
- Antet identic cu DOCX (nume bold ~11pt, 3 rânduri ~9pt gri, linie subțire).
- Titlu centrat bold 14pt.
- Înlocuim `writeParagraph(content.intro/object/…)` cu un helper nou `writeRichParagraph(runs, { align: "justify" })` care iterează cuvântul-cu-cuvânt prin runs, comutând `setFont("helvetica","bold"/"normal")` pe fragmente, calculând lățimea și wrap-ul manual cu `getStringUnitWidth`. Asta produce porțiuni bold exact ca în UI.
- Clauza finală: italic + culoare `#6B7280`, font size 9.
- Poze: păstrăm grid-ul 2-up existent (deja corect) cu caption „Poza N" sub fiecare.
- Semnături: layout cu label bold ~10pt, nume regular, semnătură (sau italic „— nesemnat —"), linie, „Semnat …" 8pt gri — exact ca SigBox.
- Footer: rămâne neschimbat.

### 4. Verificare
- Descarcă PDF + DOCX pentru un PV semnat de ambele părți; compară vizual cu dialogul.
- Verifică wrap-ul, alinierea justified, lățimea pozelor și aspectul semnăturilor.
- Verifică că diacriticele sunt înlocuite corect în PDF (Helvetica nu le suportă — `noDia` aplicat deja).
- Verifică pe un PV doar pe jumătate semnat (apar „— nesemnat —" în loc de imagine semnătură).

## Fișiere modificate
- `src/lib/pvContent.ts` (adaugă `buildPvRichContent` cu runs structurate; păstrează `buildPvContent` pentru back-compat)
- `src/lib/pvDocx.ts` (folosește runs + grid de poze 2-col + final clause italic muted)
- `src/components/rentals/PvSignatureDialog.tsx` (PDF generator rescris cu logo + runs bold + signature box aliniat; JSX-ul folosește același helper de runs ca să garanteze identitatea)

## Out of scope
- Nu schimbăm conținutul textului PV-ului (frazele rămân aceleași) și nu modificăm logica de upload/semnare.
- Nu adăugăm watermark sau pagini multiple — PDF-ul rămâne A4 portrait; spargerea pe pagini se face automat la overflow.
- Nu schimbăm logo-ul sau datele de companie (`COMPANY`).
