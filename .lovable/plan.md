## Problem
Pe mobil (390px), cardul TrustBarPremium folosește `grid-cols-2` și textele sunt tăiate cu `truncate` ("utilizatori veri...", "Plăți secu...", "rating mediu (...").

## Modificare
Fișier: `src/components/home/TrustBarPremium.tsx`

1. Schimb grid-ul din `grid-cols-2 md:grid-cols-4` în `grid-cols-1 md:grid-cols-4` — pe mobil cele 4 elemente vor fi una sub alta, full width.
2. Elimin `truncate` de pe `value` și `label` (nu mai e nevoie când au lățime completă) și permit text-wrap normal.
3. Mențin gap-ul redus pe mobil (`gap-2`) și aspectul compact (px-3 py-2.5) pentru a nu ocupa prea mult spațiu vertical.
4. Păstrez restul (iconițe, culori, count-up animation) neschimbat.

Nu modific desktop layout-ul (rămâne 4 coloane).
