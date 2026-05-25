## Modificare

În `src/components/home/HowItWorksMini.tsx`, înlocuiesc blocul mobil (`md:hidden` cu scroll snap orizontal) cu același timeline vertical folosit pe pagina "Cum funcționează".

### Pași
1. Import `CycleTimeline` din `@/components/howitworks/CycleTimeline`.
2. Șterg blocul `{/* Mobile: horizontal scroll snap */}` (linii 66–87).
3. În locul lui, randez `<div className="md:hidden"><CycleTimeline steps={steps} /></div>`.
   - `CycleTimeline` are deja propriul layout mobile (linia verticală cu dot-uri portocalii, carduri stivuite, animație scroll-driven) care e identic cu imaginea 2.
4. Variantele desktop și tabletă rămân neschimbate.

Niciun alt fișier nu trebuie modificat. Copia text (PAS · 01 etc., titluri, descrieri) e identică pentru că `steps` folosește același `uxCopy.howItWorksPage`.
