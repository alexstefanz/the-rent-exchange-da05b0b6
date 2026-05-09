## Problem
Pagina `/owner` (Produsele mele) nu folosește `LendingsTab`, ci `src/pages/Owner.tsx`. Acolo imaginea și titlul nu sunt link-uri — de asta click-ul nu face nimic.

## Soluție
În `src/pages/Owner.tsx`, fac imaginea și titlul clickable către anunțul live folosind `getProductUrl(product)`:

- Import `getProductUrl` din `@/lib/slugUtils`.
- Wrap container-ul imaginii (`<div className="relative aspect-[4/3]...">`) într-un `<Link to={getProductUrl(product)}>`.
- Wrap `<h3>` titlu într-un `<Link>` cu `hover:text-primary`.
- Pentru produse `pending`/`rejected`/`approved + inactive` păstrez aceleași link-uri (anunțul oricum este vizibil ownerului, iar pentru pending/rejected ownerul tot îl poate previzualiza).
- Butoanele Delete/Edit rămân neschimbate (sunt deja în afara ariei imaginii/titlului).
- Adaug `cursor-pointer` și hover subtil pe Card.

## Scope
- Doar UI, un singur fișier: `src/pages/Owner.tsx`
- Fără schimbări de rute, API, sau business logic.