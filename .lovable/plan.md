## Problema
În PDF, blocul de semnături trece pe pagina 2 chiar dacă pe pagina 1 rămâne spațiu liber considerabil sub fotografii (vezi screenshot).

## Cauza
În `src/components/rentals/PvSignatureDialog.tsx → generatePdf()`:
- La final, există: `if (y + 130 > H - 40) { doc.addPage(); y = 50; }` — bloc semnături ~130pt.
- Înainte, fotografiile sunt așezate într-o grilă 2 col cu `maxImgH = 160` și fiecare rând rezervă `maxImgH + 18` indiferent de înălțimea reală a imaginii redimensionate (`ensureSpace` folosește maxim, nu real). Astfel `y` ajunge prea jos și forțează page break pentru semnături, chiar dacă spațiul rămas e suficient.

## Plan (doar PDF, fără modificări DOCX/UI)

Fișier: `src/components/rentals/PvSignatureDialog.tsx`, funcția `generatePdf`.

1. **Reduce înălțimea reală a rândului de poze**: la calcularea page-break-ului pentru rândul de fotografii, folosește înălțimea reală maximă a celor 2 poze din rând (după scalare la `colW`), nu `maxImgH` fix. Astfel `y` nu mai e împins inutil în jos.
2. **Compactează blocul semnături când e necesar**: înainte de page break, dacă spațiul rămas (`H - 40 - y`) e între ~95 și 130pt, folosește o variantă compactă (semnătură 50pt în loc de 60pt, spacing redus) ca să încapă pe pagina 1. Dacă e sub ~95pt, atunci da, page break.
3. **Reduce și `maxImgH`** de la 160 la ~130pt pentru a câștiga spațiu vertical pe pagina 1 (pozele rămân clare la grilă 2 coloane, lățimea e dominantă oricum).
4. **Margine de jos**: reduc `H - 40` margin guard la `H - 30` pentru semnături (ultimul element al documentului), ca să nu mai forțeze break la limită.

## Rezultat
Pentru cazurile tipice (2-6 poze), semnăturile vor încăpea pe pagina 1 sub fotografii. Pentru documente cu multe poze, page break-ul se păstrează corect.

## Out of scope
- DOCX rămâne neschimbat.
- Conținutul textual nu se modifică.
- UI dialog rămâne neschimbat.