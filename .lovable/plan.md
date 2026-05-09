## Problem
În `Profil → Anunțurile mele`, cardurile produselor nu sunt clickable. Acum doar iconul mic 👁 deschide anunțul.

## Soluție
În `src/components/dashboard/LendingsTab.tsx` fac întregul card clickable:

- Imaginea + titlul + prețul devin un `<Link to={productUrl}>` (sau `<a target="_blank">` pentru produsele `pending`, ca să fie consistent cu butonul de preview existent).
- Butoanele rămân separate (Eye/Preview, Edit) cu `e.stopPropagation()` ca să nu declanșeze navigarea când se face click pe ele.
- Hover state pe card: `hover:shadow-card-hover transition-all cursor-pointer`.
- `StatusBadge` rămâne în colț, în afara zonei de click pentru a nu interfera vizual.

## Scope
- Doar UI, un singur fișier: `src/components/dashboard/LendingsTab.tsx`
- Fără schimbări de rute, API sau business logic.