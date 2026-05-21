## Schimbări
1. **Revine la zilele trecute gri în săptămâna curentă** — scot prop-ul `hidden`, păstrez `disabled`. Săpt. 17-23 va arăta 17-20 în gri, 21-23 activ. Regula CSS existentă continuă să ascundă rândurile complet trecute (3-9, 10-16).
2. **Calendarul afișează 2 luni stacked** — adaug `numberOfMonths={2}` pe `<CalendarComponent>` ca să umple spațiul vertical din card și să arate și luna următoare (June 2026) sub mai.

## Fișier
`src/components/product/PremiumBookingCard.tsx` — elimin `hidden={...}` + `startOfToday` import, adaug `numberOfMonths={2}`.

## Note
- shadcn Calendar deja face stack pe coloană pentru viewport mic (`flex-col sm:flex-row`). În card sidebar (lățime ~400px) va rămâne pe coloană → cele 2 luni una sub alta.
- Bookings/preț/buton rămân neschimbate dedesubt.