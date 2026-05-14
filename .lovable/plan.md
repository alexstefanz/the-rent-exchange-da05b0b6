## Problem

Utilizatorul banat poate accesa direct `/adauga-anunt` → `/owner/new-product` (PublishProduct page) chiar dacă butoanele din header sunt dezactivate. Trebuie blocat și la nivelul paginii.

## Schimbări

### `src/pages/PublishProduct.tsx`
- Importă `useIsBanned` și `BannedBanner`.
- După verificarea `authLoading` și înainte de `KycGateBanner`, dacă `isBanned === true`:
  - Pentru `mode === "create"`: afișează `<BannedBanner />` într-un container centrat cu mesaj "Nu poți publica anunțuri cât timp contul este suspendat" + buton "Înapoi" către `/`.
  - Pentru `mode === "edit"`: același tratament — utilizatorul banat nu poate edita anunțuri existente.

### `src/components/layout/Navbar.tsx` (verificare)
- Confirmă că link-ul `/adauga-anunt` din meniul mobil/desktop e deja ascuns/disabled pentru `isBanned` (deja făcut într-o iterație anterioară). Fără modificări dacă e ok.

## Note tehnice
- `useIsBanned()` returnează `{ isBanned, banReason, loading }`. Așteaptă `loading === false` înainte de a decide (combină cu `authLoading`).
- Backend-ul are deja RLS care blochează `INSERT`/`UPDATE` pe `products` pentru banați, deci e doar UX-ul care lipsește pe această rută.

## Out of scope
- Nu modific RLS sau alte pagini — sunt deja acoperite în iterația precedentă.
