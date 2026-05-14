## Scop

Înlocuiesc secțiunea „Cum funcționează" de pe homepage cu **toți cei 6 pași** din pagina `/cum-functioneaza` (Cerere trimisă, Cerere aprobată, În tranzit, În utilizare, Returnare, Plată), afișați **orizontal** (nu zigzag, nu vertical).

## Schimbări

### `src/components/home/HowItWorksMini.tsx`
- Import iconițe: `Send, CheckCircle2, Package, Wrench, Undo2, Wallet` din lucide-react.
- Folosesc `useUxCopy()` → `copy.howItWorksPage` pentru a prelua exact aceleași texte (`cycleStep1Title`...`cycleStep6Desc`) ca pe pagina sursă (deja bilingve via uxCopy).
- Header: chip „PROCESUL" + titlu „Cum decurge o închiriere" (din `p.processTitle`) + subtitlu (`p.processSubtitle`).
- Layout orizontal:
  - **Desktop (lg+):** grid `grid-cols-6` cu cei 6 pași în linie. Fiecare pas: iconiță 56×56 într-un container `rounded-2xl border bg-card shadow-card` cu icon `text-primary`, badge „PAS · 0X", titlu, descriere scurtă centrate.
  - **Linie de conectare orizontală** între iconițe (`absolute h-px bg-primary/30 top-7` cu puncte mici portocalii peste iconițe — efect de timeline orizontal).
  - **Tablet (md):** `grid-cols-3` (2 rânduri × 3 pași), fără linie continuă.
  - **Mobile:** scroll orizontal `overflow-x-auto` cu carduri `min-w-[260px]` snap-x — păstrează caracterul orizontal cerut, ușor swipe-abil.

### Out of scope
- Nu modific `src/pages/HowItWorks.tsx` sau dicționarul `uxCopy.ts`.
- Nu modific `src/components/product/HowItWorksMini.tsx`.

## Note tehnice
- Cheile uxCopy `howItWorksPage.cycleStep{1..6}{Title,Desc}`, `processBadge`, `processTitle`, `processSubtitle` există deja — doar le reutilizez.
- Background secțiune: `bg-secondary/30` (consistent cu restul homepage-ului).
