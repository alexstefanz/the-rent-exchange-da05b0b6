## Plan: Înlocuire "escrow" → "custodie" doar în textele RO

### Scop
În textele românești, cuvântul "escrow" (și variantele "depozit în garanție") devine "custodie". Textele EN rămân neschimbate ("escrow").

### Fișiere modificate

**1. `src/components/checkout/PremiumBookingSummary.tsx` (linia 97)**
- RO: `Plată securizată — bani blocați în escrow` → `Plată securizată — bani blocați în custodie`
- EN: rămâne `Secure payment — funds held in escrow`

**2. `src/components/checkout/PaymentTrustStrip.tsx` (linia 8)**
- Deja corect în RO (`Suma este ținută în custodie`). Nu modific.

**3. `src/data/uxCopy.ts` — doar partea `ro:`**
- L540 `payment.ro`: `Plată securizată cu cardul (escrow)` → `Plată securizată cu cardul (custodie)`
- L627 `tenantStep2Desc.ro`: `…în depozit (escrow), nu este debitată încă.` → `…în custodie, nu este debitată încă.`
- L644 `escrowTitle.ro`: `Depozit în garanție` → `Custodie securizată`
- L645 `escrowSubtitle.ro`: `Modelul nostru de hold & capture (depozit în garanție) protejează…` → `Modelul nostru de hold & capture (custodie) protejează…`
- L705 `escrowPill.ro`: `DEPOZIT ÎN GARANȚIE ACTIV` → `CUSTODIE ACTIVĂ`
- L708 `escrowBigDesc.ro`: `Serviciu integrat de depozit în garanție.` → `Serviciu integrat de custodie.`
- L709 `escrowAmountLabel.ro`: `Sumă în depozit` → `Sumă în custodie`

### Notă
- Numele cheilor (`escrowTitle`, `escrowPill`, etc.) rămân neschimbate — sunt identificatori interni, nu text vizibil.
- Toate textele englezești (`en:`) rămân neatinse.