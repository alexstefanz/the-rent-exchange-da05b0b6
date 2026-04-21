

## Plan: Actualizare pagină "Cum funcționează" cu noul timeline al rezervărilor

### Context
Pagina `/cum-functioneaza` prezintă acum 4 pași generici per rol (chiriaș/proprietar). Vreau să o aliniez cu noul ciclu de viață real al rezervării — același 6 pași folosiți în `RentalTimeline.tsx`:

1. Cerere trimisă
2. Cerere aprobată
3. În tranzit (predare)
4. În utilizare
5. În returnare
6. Finalizat

### Ce schimb

#### 1. Hero — adaug subtitlu cu mențiunea timeline
Actualizez `heroSubtitle` să menționeze cele 6 etape transparente ale rezervării.

#### 2. Secțiune nouă: "Ciclul rezervării" (înainte de "Pentru chiriași")
Componentă vizuală orizontală pe desktop / verticală pe mobil (replică simplificată a `RentalTimeline`):
- 6 cercuri numerotate conectate cu linii
- Fiecare pas: iconiță Lucide + titlu + descriere scurtă (1 frază)
- Iconițe: `Send` (cerere) → `CheckCircle2` (aprobat) → `Truck` (tranzit) → `PackageCheck` (utilizare) → `Undo2` (returnare) → `Star` (finalizat)
- Background subtil bg `secondary/30` pentru a separa de restul

#### 3. Restructurare "Pentru chiriași" și "Pentru proprietari"
Aliniez cei 4 pași existenți cu timeline-ul real:

**Chiriaș (4 pași simplificați, mappati pe timeline):**
1. Caută & rezervă (pas 1 timeline) — Search icon
2. Așteaptă confirmarea (pas 2) — Bell icon
3. Ridică & folosește (pași 3–4) — PackageCheck icon
4. Returnează & evaluează (pași 5–6) — Star icon

**Proprietar (4 pași simplificați):**
1. Publică anunțul — ListPlus icon
2. Acceptă cererea (pas 2) — Handshake icon
3. Predă & monitorizează (pași 3–4) — Truck icon
4. Primește plata (pași 5–6) — Wallet icon

#### 4. Adaug secțiune "Plata în siguranță" (nouă)
Card explicativ scurt despre modelul escrow:
- "Banii sunt rezervați pe card la cerere"
- "Capturăm plata doar când proprietarul confirmă predarea"
- "Anularea înainte de predare = refund automat 100%"

Plasez între "Pentru proprietari" și "Why Rentli".

#### 5. Actualizare FAQ
Adaug 2 întrebări noi:
- "Cum știu în ce etapă e rezervarea mea?" → răspuns despre timeline-ul vizibil în Dashboard
- "Ce se întâmplă dacă anulez după aprobare dar înainte de predare?" → răspuns despre refund automat

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/pages/HowItWorks.tsx` | Adaug secțiunea timeline + secțiunea escrow + actualizez stepCards |
| `src/data/uxCopy.ts` | Adaug chei noi RO/EN: `rentalCycle*` (6 pași titluri+descrieri), `escrow*` (titlu + 3 puncte), 2 FAQ noi; rescriu `tenantStep*Title/Desc` și `ownerStep*Title/Desc` aliniat |

### Aspecte UX
- Timeline-ul vizual e identic conceptual cu cel din `RentalTimeline.tsx` → consistență cross-platformă (utilizatorul vede aceleași etape în pagina explicativă și în dashboard-ul lui)
- Iconițele Lucide păstrează stilul `rounded-2xl` `primary/10` definit în `mem://design/icon-container-style`
- Bilingv complet RO/EN
- Nu modific layout-ul Hero, CTA sau Trust Badges

### Limitări
- Nu refolosesc direct `RentalTimeline` ca să evit dependența de date dummy de rental — creez o variantă vizuală statică inline în pagină
- Restul secțiunilor (benefits, breadcrumb) rămân neschimbate

