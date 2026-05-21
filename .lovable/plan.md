## Obiectiv
Pe calendar, prima săptămână afișată = săptămâna curentă, dar **zilele din trecut din această săptămână nu mai apar deloc** (nici măcar gri). Doar zilele de azi înainte sunt vizibile.

## Comportament
- Săpt. curentă (ex. 17-23 mai, azi=21): rândul rămâne, dar celulele 17, 18, 19, 20 sunt **goale** (invizibile). Apar doar 21, 22, 23.
- Săpt. viitoare: complete, normal.
- Săpt. complet trecute: deja ascunse (regula existentă).
- Navigarea înapoi rămâne blocată (`fromMonth`).

## Implementare
Fișier: `src/components/product/PremiumBookingCard.tsx`

Adaug prop `hidden` pe `<CalendarComponent>` care marchează zilele înainte de azi:
```ts
hidden={d => isBefore(d, startOfToday())}
```
(import `startOfToday` din `date-fns`)

React-day-picker aplică pe zilele "hidden" clasa `.rdp-day_hidden` cu `visibility: hidden` — celula rămâne, dar conținutul dispare. Regula CSS existentă `.rdp-hide-past-weeks .rdp-row:not(:has(.rdp-day:not([disabled])))` continuă să ascundă rândurile complet goale.

Atributul `disabled` rămâne pentru robustețe (zilele hidden nu mai sunt selectabile oricum).

## Fișiere modificate
- `src/components/product/PremiumBookingCard.tsx` (1 linie adăugată + 1 import)