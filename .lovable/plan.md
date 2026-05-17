## Simplificare secțiune recenzii produs

Eliminăm distincția "Pentru proprietar / Pentru chiriaș" din UI. Recenzia se bazează doar pe cele 3 criterii: Stare produs, Comunicare, Punctualitate.

### Modificări

**`src/components/product/ProductReviewsSection.tsx`**
- Elimin toggle-ul "Pentru proprietar / Pentru chiriaș" din formularul de adăugare recenzie.
- Elimin `reviewType` state și badge-ul "Proprietar"/"Chiriaș" din `ReviewCard`.
- La submit, trimit implicit `reviewType: "owner"` către API (păstrăm coloana pentru compatibilitate DB, fără a o expune în UI).
- Unific afișarea: o singură listă combinată de recenzii (owner + renter existente), fără etichete de tip.
- Simplific `ReviewCard` — fără prop `type`, fără `Badge`.

### Detalii tehnice

- Nu modific schema DB (`product_reviews.review_type` rămâne, default "owner") pentru a păstra recenziile existente.
- Nu modific `productReviewsApi.ts` — continuă să returneze `{ owner, renter }`, le combinăm pe frontend.
- Nimic backend de schimbat; doar UI.
