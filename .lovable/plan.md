## Problemă
`numberOfMonths={2}` afișează lunile **una lângă alta** (shadcn Calendar are `flex-col sm:flex-row` în clasele default). Utilizatorul vrea cele 2 luni **stacked vertical** — iunie să apară sub mai.

## Fix
În `src/components/product/PremiumBookingCard.tsx`, în `classNames` pe `<CalendarComponent>` adaug override:
```ts
months: "flex flex-col gap-6 w-full"
```
Aceasta forțează coloana indiferent de breakpoint, cu spațiu între luni.

Restul comportamentului rămâne neschimbat: zilele trecute din săpt. curentă apar gri (disabled), săpt. complet trecute ascunse, iunie sub mai.

## Fișier
- `src/components/product/PremiumBookingCard.tsx` (1 linie adăugată în `classNames`)