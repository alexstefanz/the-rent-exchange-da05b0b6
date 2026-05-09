# Fix: 404 la "Vezi detalii rezervare" din chat

## Cauză

În `src/components/messaging/TransactionCard.tsx` (linia 43) cardul de tranzacție din chat generează linkul:

```ts
const link = data.publicId ? `/rentals/${data.publicId}` : null;
```

Dar ruta `/rentals/:publicId` **nu există** în `src/App.tsx`. Toate rutele relevante sunt `/rezervari` (chiriaș) și `/inchirieri` (proprietar). De aceea utilizatorul, după ce a deschis chat-ul cu proprietarul, a primit 404 când a apăsat "Vezi detalii rezervare" (săgeata din cardul produsului din conversație).

Userul a interpretat-o ca venind de la "Contactează proprietarul" pentru că este următorul pas natural în flux.

## Soluție

1. **`TransactionCard.tsx`** — înlocuiesc linkul nefuncțional cu navigare la pagina de rezervări corectă în funcție de rolul utilizatorului în conversație. Adaug un prop `role: "renter" | "owner"` la componentă; linkul devine:
   - `renter` → `/rezervari?focus=<publicId>`
   - `owner`  → `/inchirieri?focus=<publicId>`

2. **`AdminConversation` / chat user (`ConversationView`)** — locul care randează `<TransactionCard>` îi pasează rolul (deja se știe dacă userul curent este `renter_id` sau `owner_id` din rental). Pentru admin pot lăsa default `renter`.

3. **`RentalsPage` (`/rezervari`) și `RentalsOutPage` (`/inchirieri`)** — citesc `searchParams.get("focus")`. Dacă există un public_id corespunzător în listă, fac scroll/highlight pe cardul respectiv (`scrollIntoView({ behavior: "smooth", block: "center" })` + ring temporar 2s).

## Fișiere modificate

- `src/components/messaging/TransactionCard.tsx` — prop nou `role`, link corect.
- `src/pages/messaging/ConversationView.tsx` (sau echivalent unde se folosește TransactionCard) — pasează rolul.
- `src/components/admin/AdminConversation.tsx` — pasează rolul (default `renter`).
- `src/pages/RentalsPage.tsx` — focus + highlight prin `?focus=`.
- `src/pages/RentalsOutPage.tsx` — focus + highlight prin `?focus=`.

## Verificare

- Click pe "Vezi detalii rezervare" din chat → ajung pe `/rezervari` (sau `/inchirieri`) cu cardul rezervării evidențiat.
- Niciun 404.
