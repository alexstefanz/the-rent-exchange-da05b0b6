# Toggle Grid/List pe mobil — Categorii și Search

Switch-ul grid/list există deja pe desktop (în `CategoryDetail.tsx` și `Search.tsx`), dar e ascuns pe mobil (`hidden sm:flex`). Îl fac vizibil pe toate dimensiunile.

## Modificări
- `src/pages/CategoryDetail.tsx` — schimb `hidden sm:flex` → `flex` pe containerul cu cele 2 butoane (LayoutGrid / List).
- `src/pages/Search.tsx` — același lucru.

## Notă
Pe mobil, în modul „list" cardurile vor fi stivuite vertical pe toată lățimea (grila actuală `grid-cols-2` se folosește doar în modul „gallery"). Codul deja suportă asta — `viewMode === "list"` returnează `flex flex-col gap-4`.

Despre „pagina de produse": în proiect nu există o pagină distinctă `/produse` — listele de produse sunt afișate pe Categorii și Search. Dacă te referi la „Produsele mele" (`/anunțuri`, dashboard-ul tău), spune-mi și adaug acolo separat.
