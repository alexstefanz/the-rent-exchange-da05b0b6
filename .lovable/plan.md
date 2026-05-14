
# Redesign pagina `/cum-functioneaza`

Restructurez complet `src/pages/HowItWorks.tsx` păstrând doar 4 secțiuni mari, în această ordine:

1. **Hero** (refinat ușor)
2. **Timeline central — "Cum decurge o închiriere"** (imaginea 1)
3. **"De ce ne aleg utilizatorii"** — bento cu card mare escrow + 4 carduri mici (imaginea 2)
4. **Întrebări frecvente** (redesign)
5. **Gata să începi?** CTA (redesign)

Elimin secțiunile actuale **"Pentru chiriași"**, **"Pentru proprietari"** și **"Plăți securizate (escrow)"** standalone — informația lor este absorbită în noul timeline + bento.

---

## 1. Timeline central — "Cum decurge o închiriere"

Folosesc cei 6 pași `cycleSteps` existenți din `uxCopy` (`Trimiți cererea` → `Plata se finalizează`). Layout zigzag pe desktop cu linie verticală orange centrală și nod-puncte; pe mobil rămâne timeline vertical stânga.

```text
PROCESUL
       Cum decurge o închiriere
   Șase pași simpli, urmăriți în timp real

  ┌──────────────┐    ●          ┌──── icon ───┐
  │ pas 01       │    │          │   [send]    │
  │ Trimiți      │────┤          └─────────────┘
  │ cererea      │    │
  │ desc...      │    │
  └──────────────┘    │
                      │          ┌──────────────┐
  ┌──── icon ───┐     ●─────────│ pas 02       │
  │  [check]    │     │          │ Proprietarul │
  └─────────────┘     │          │ aprobă       │
                      │          │ desc...      │
                      │          └──────────────┘
                      ●  ... etc 6 pași
```

Detalii tehnice:
- Container `relative` cu pseudo-line `absolute left-1/2 w-px bg-gradient-to-b from-primary/40 via-primary to-primary/40` pe desktop.
- Fiecare pas = `grid grid-cols-2` cu `text-right` (col stânga) sau `text-left` (col dreapta) după paritate; mobile devine `flex` vertical.
- Badge `PAS · 0X` cu `bg-primary/10 text-primary` deasupra titlului.
- Iconul în pătrat 64×64 cu `rounded-2xl border border-border bg-card shadow-card`.
- Punct central 12×12 `rounded-full bg-primary ring-4 ring-background`.
- Stat-strip sub timeline: `12.000+ utilizatori activi · 45.000+ închirieri reușite · 98% rată satisfacție · 2h timp răspuns` — număr mare în primary, label muted.

Adaug în `src/data/uxCopy.ts` cheile:
- `processBadge` "PROCESUL"
- `statsActiveUsers / statsRentals / statsSatisfaction / statsResponseTime` (label + valoare)
- păstrez `cycleStep1..6Title/Desc` existente.

## 2. "De ce ne aleg utilizatorii" — bento

Layout: pe desktop `grid grid-cols-3` unde cardul escrow ocupă `col-span-1 row-span-2` (stânga, mare, dark) și 4 carduri mici ocupă restul (`col-span-2 grid grid-cols-2 gap-4`). Pe mobil totul devine 1 coloană.

**Card mare (escrow, dark):**
- `rounded-3xl bg-gradient-to-br from-[#1a1410] via-[#221913] to-[#2a1f17] p-8` cu pattern subtil.
- Pill verde `● ESCROW ACTIV`.
- Titlu mare alb cu ultimele cuvinte în primary: "Plăți protejate <span className="text-primary">end-to-end.</span>".
- Paragraf descriptiv (escrow + PV semnat).
- Mini-card "status pre-autorizare": sumă mock, bară de progres (Pre-autorizat → În derulare → Eliberat la final), badge `SECURIZAT` verde.
- Pile-uri jos: `PSD2 · 3DS2 · PCI-DSS · GDPR`.

**4 carduri mici (light):**
| # | Icon | Stat (sus-dreapta) | Titlu | Desc |
|---|------|-------------------|-------|------|
| 1 | CheckCircle | `100% VERIFICAȚI` | Identitate verificată | KYC complet pentru toți utilizatorii. |
| 2 | Shield | `5.000 LEI ACOPERIRE` | Asigurare inclusă | Acoperire de bază la fiecare rezervare. |
| 3 | Headphones | `<2h TIMP RĂSPUNS` | Suport rapid | Echipă reală, răspuns sub 2h. |
| 4 | Tag | `0 lei LA LISTARE` | Fără comision la listare | Plătești doar când închiriezi cu succes. |

Stil card mic: `rounded-2xl bg-card border border-border p-6`, icon în cerc `bg-primary/10`, stat în dreapta-sus în primary uppercase mic.

Adaug în `uxCopy`:
- `whyDifferenceBadge` "DIFERENȚA RENTLI"
- `whyTitle` "De ce ne aleg utilizatorii"
- `whySubtitle`
- `escrowCardPill`, `escrowCardTitle`, `escrowCardTitleAccent`, `escrowCardDesc`, `escrowAmountLabel`, `escrowStatusSecured`, `escrowStep1/2/3` (Pre-autorizat / În derulare / Eliberat la final)
- pentru fiecare din cele 4 carduri: `stat`, `statLabel`, `title`, `desc`.

## 3. Întrebări frecvente — redesign

- Container `max-w-3xl mx-auto`.
- Eyebrow chip "FAQ" în primary deasupra titlului.
- Accordion items cu stil card: `rounded-2xl border border-border bg-card px-6` (în loc de underline default), `data-[state=open]:bg-secondary/40`, icon `+`/`−` rotativ în dreapta.
- Spacing `space-y-3` între items.
- Păstrez cele 8 FAQ-uri existente din `uxCopy`.

## 4. CTA "Gata să începi?" — redesign

- Card centrat `max-w-4xl rounded-3xl bg-gradient-to-br from-primary via-[#F98715] to-[#e8780f] text-primary-foreground p-12 text-center shadow-glow`.
- Pattern subtil radial alb 5% pe fundal.
- Titlu mare bold + subtitlu cu opacity 90.
- 2 butoane: primary "Caută produs" (`bg-background text-foreground`) + outline alb "Listează gratuit".
- Linie mică sub butoane: `Fără card. Fără abonament. Listare gratuită.` cu check icon.

---

## Fișiere modificate
- `src/pages/HowItWorks.tsx` — rewrite complet (păstrez Navbar/Footer/Breadcrumb).
- `src/data/uxCopy.ts` — adaug cheile noi listate mai sus (RO + EN), elimin nimic existent (pentru siguranță).
- *(opțional)* extragere a Timeline-ului și a Bento-ului în 2 sub-componente în `src/components/howitworks/` pentru lizibilitate (`RentalProcessTimeline.tsx`, `WhyRentliBento.tsx`).

## Out of scope
- Nicio modificare backend, RPC sau RLS.
- Nu schimb rutele sau navbarul.
- Imaginile uploadate sunt strict referințe vizuale — nu sunt embed-uite.
