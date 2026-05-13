## Adăugare „N zile × X RON" în card-ul de rezervare

În `src/components/product/PremiumBookingCard.tsx`, în secțiunea Breakdown (deasupra rândului „Total"), adaug o linie nouă cu formatul `{rentalDays} {zile/days} × {clientPrice} RON`, stilizată identic cu celelalte rânduri (text muted la stânga, valoare la dreapta), exact ca în screenshot.

### Modificare
- Inserez un nou `div.flex.justify-between` între rândul „Sfârșit" și `Separator`, folosind `rentalDays` și `clientPrice` care sunt deja calculate în component.
- Plural RO: `zi` pentru 1, altfel `zile`. EN: `day`/`days`.

Nu schimb nimic la calculul `totalPrice` (rămâne din `computeRentalPrice` cu tarife săptămână/lună).