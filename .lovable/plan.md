## Goal

Replace the current "De ce Rentli?" row on the homepage (`WhyRentli`) with the bento section from the "Cum funcționează" page ("DIFERENȚA RENTLI / De ce ne aleg utilizatorii" — protected payments big card + 4 stat cards), and reuse the exact same section on both pages.

## Steps

1. **Create a shared component** `src/components/home/WhyChooseUsBento.tsx`
   - Move the JSX from `src/pages/HowItWorks.tsx` lines 155–246 (the entire `<section>` "Why users choose us — bento") into this new component.
   - Move the `bentoCards` array (line 31–36) inside the component.
   - Import needed icons (`ShieldCheck`, `UserCheck`, `Tag`, `Headphones`) and `useUxCopy`.
   - Keep all existing copy keys (`whyBadge`, `whyTitle`, `whySubtitle`, `escrowPill`, `escrowBigTitle`, `escrowBigTitleAccent`, `escrowBigDesc`, `escrowAmountLabel`, `escrowAmount`, `escrowSecuredBadge`, `escrowStage1/2/3`, plus all `bento*` keys) from `howItWorksPage` — no copy duplication needed.

2. **Use it on `HowItWorks.tsx`**
   - Replace the inlined section (lines 155–246) with `<WhyChooseUsBento />`.
   - Remove the now-unused `bentoCards` const and unused icon imports if no longer referenced elsewhere on the page.

3. **Use it on `Index.tsx` (homepage)**
   - Replace `<WhyRentli />` (line 76) with `<Suspense>`-lazy `WhyChooseUsBento` following the same lazy-loading pattern as siblings.
   - Remove the `WhyRentli` lazy import (line 10).
   - Leave `src/components/home/WhyRentli.tsx` in place (unused) — safe to delete since nothing else references it.

## Notes

- No copy changes, no new translations needed — the section already exists fully bilingual under `howItWorksPage`.
- No business-logic changes.
- Visual output on homepage will exactly mirror the section on `/cum-functioneaza`.
