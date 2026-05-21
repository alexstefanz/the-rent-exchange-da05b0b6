## Obiectiv
Ascunde săptămânile complet trecute din calendarul de booking pe pagina produs. Calendarul afișează doar săptămâna curentă (cu zile trecute dezactivate gri) și săptămânile viitoare.

## Comportament
- Săptămâna curentă (ex: 17-23 mai) rămâne vizibilă integral. Zilele trecute apar dezactivate.
- Toate săptămânile complet anterioare săptămânii curente sunt **eliminate vizual** (rândul dispare, nu rămâne loc gol).
- Când utilizatorul navighează la o lună viitoare, săptămânile se afișează normal.
- Navigarea „mai devreme de luna curentă" e blocată (`fromMonth`).

## Implementare tehnică
Fișier: `src/components/product/PremiumBookingCard.tsx`

1. Adaugă `fromMonth={new Date()}` pe `<CalendarComponent>` ca să blocheze navigarea în trecut.
2. Calculează `startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 })` (Su, ca în screenshot).
3. Păstrează `disabled={d => isBefore(d, new Date()) || isDateBooked(...)}` — zilele trecute rămân gri/dezactivate.
4. Ascunde rândurile întregi care conțin doar zile dinaintea săptămânii curente, printr-o regulă CSS scoped pe wrapper-ul calendarului:

```text
<wrapper data-hide-past-weeks>
  <Calendar ... />
</wrapper>

CSS:
[data-hide-past-weeks] .rdp-row:not(:has(.rdp-day:not([disabled])))
  -> display: none doar pentru luna curentă (afișarea curentă)
```

Detaliu: regula corectă este să ascundem rândul **dacă toate zilele lui sunt înainte de `startOfCurrentWeek`**. Cea mai sigură abordare e custom: folosim `components={{ Row: CustomRow }}` din react-day-picker, unde `CustomRow` primește `dates: Date[]` și returnează `null` dacă `dates.every(d => isBefore(d, startOfCurrentWeek))`. Astfel funcționează corect și pentru luni viitoare (unde nicio săptămână nu e ascunsă).

5. Verificăm vizual că:
   - Pe luna curentă, doar săptămâna 17-23 + următoarele apar; rândurile cu 26-2 și 3-9 dispar complet.
   - Navigarea înainte funcționează; săgeata înapoi e dezactivată în luna curentă.
   - Zilele trecute din săptămâna curentă (17-20) sunt gri, neselectabile.

## Memo
Actualizez `mem://features/product-availability-calendar` cu noul comportament „hide past weeks, show current week with disabled past days".

## Fișiere modificate
- `src/components/product/PremiumBookingCard.tsx` (singur fișier)
- `mem://features/product-availability-calendar` (memo update)