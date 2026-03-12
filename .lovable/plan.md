
Obiectiv: booking card-ul să fie aliniat sus cu imaginea pe desktop și să rămână vizibil (sticky) până la zona de recenzii, fără „dispariție” prematură și fără gol mare în coloana din dreapta.

Ce am observat din capturile tale:
- Cardul începe corect sus.
- La scroll, cardul este împins în sus prea devreme (se vede doar partea de jos), apoi dispare înainte de zona de recenzii.
- Asta indică un „sticky track” prea scurt pe coloana dreaptă (parentul sticky se termină înainte de finalul conținutului din stânga).

Plan de implementare (fix structural, nu doar tweak de o clasă):
1) Refactor layout-ul desktop al blocului principal din `ProductDetail.tsx` ca să garantăm track-ul sticky:
   - Grid-ul rămâne pentru 2 coloane pe desktop, dar îl fac explicit cu stretch:
     - `lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`
     - `lg:items-stretch`
   - Eliminăm dependența de `col-span` pe 3 coloane pentru această zonă.

2) Forțăm coloana din dreapta să aibă aceeași înălțime cu coloana de conținut:
   - Pe wrapper-ul sidebar:
     - `lg:self-stretch lg:h-full`
   - Adăugăm un wrapper intern de track:
     - `className="h-full"` (parent clar pentru sticky boundary)

3) Separăm clar „track-ul” de „card”:
   - Sticky pe wrapper-ul interior de sidebar (desktop only):
     - `lg:sticky lg:top-24`
   - Cardul efectiv rămâne normal în interior (border/padding etc), iar scroll intern rămâne doar dacă e necesar:
     - `lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`
   - Pe mobile păstrăm comportamentul actual (fără sticky desktop classes active).

4) Eliminăm clase care pot afecta comportamentul sticky pe verticală:
   - Scoatem `overflow-x-hidden` de pe wrapper-ele mari din `ProductDetail` (root + `main`) pentru a evita clipping/containment nedorit al sticky-ului în unele browsere.

5) Validare manuală strictă după implementare (desktop):
   - La top: cardul aliniat cu imaginea.
   - Scroll în zona owner/descriere/hartă: cardul rămâne sticky sus.
   - Scroll în zona recenzii: cardul încă vizibil.
   - Aproape de finalul recenziilor: cardul începe să „se dezlipească” doar la finalul track-ului, nu înainte.
   - Verificare și pe 1366x768 + viewport mare (ca în cazul tău).

Detalii tehnice (pe scurt):
- Problema nu este doar `top` sau `max-h`, ci boundary-ul sticky (înălțimea parentului sticky).
- Fixul corect este să asigurăm:
  1) parent de sticky suficient de înalt (egal cu coloana stângă),
  2) sticky aplicat pe stratul potrivit,
  3) fără overflow pe straturi superioare care pot rupe sticky logic.
- Fișier vizat: `src/pages/ProductDetail.tsx` (doar frontend layout/classes).

Impact:
- Nu atinge backend, auth sau date.
- Doar comportament UI desktop în pagina de produs.
