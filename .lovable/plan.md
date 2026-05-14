## Înlocuire termen "escrow" cu "depozit în garanție"

Pe pagina **Cum funcționează** (și unde apare în uxCopy în context de rezervare), textul "escrow" sună prea tehnic/străin. Îl înlocuim cu formula românească **"depozit în garanție"** / **"sistem de depozit în garanție"**, păstrând paralela engleză cu "escrow" doar pe versiunea EN.

### Modificări (doar text, în `src/data/uxCopy.ts`)

Secțiunea bento "Plăți protejate" de pe `/cum-functioneaza`:
- `escrowPill` → RO: **"DEPOZIT ÎN GARANȚIE ACTIV"** / EN: "ESCROW ACTIVE"
- `escrowBigDesc` → RO: **"Serviciu integrat de depozit în garanție. Banii sunt eliberați doar când produsul este predat în bune condiții, conform PV-ului semnat digital de ambele părți."** / EN nemodificat
- `escrowAmountLabel` → RO: **"Sumă în depozit"** / EN nemodificat
- `escrowSecuredBadge` → RO: rămâne "SECURIZAT"
- `escrowStage1/2/3` → rămân ("Pre-autorizat" / "În derulare" / "Eliberat la final")

Secțiunea generică "Plata în siguranță" (folosită în alte locuri, dacă apare):
- `escrowTitle` → RO: **"Depozit în garanție"** / EN: "Secure escrow payment"
- `escrowSubtitle` → RO: **"Modelul nostru de hold & capture (depozit în garanție) protejează ambele părți la fiecare rezervare."**

Pas tenant:
- `tenantStep2Desc` → RO: **"Primești o notificare imediat ce proprietarul aprobă cererea. Plata rămâne în depozit (escrow), nu este debitată încă."**

### Ce NU se schimbă
- Cheile/identifierii din cod (`escrowPill`, `escrowBigDesc` etc.) — doar valorile RO.
- Versiunile EN păstrează "escrow" (termen consacrat internațional).
- Comentariul `// Escrow section` din uxCopy poate rămâne (nu e vizibil).
- Bannerul mare păstrează titlul scurt **"Plăți protejate end-to-end."** (mai lizibil decât "Depozit în garanție end-to-end").

Confirmi și implementez?