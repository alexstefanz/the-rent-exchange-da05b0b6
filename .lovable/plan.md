# Break la trecerea de la o lună la alta în calendar

## Ce văd acum
În `PremiumBookingCard.tsx` calendarul are `numberOfMonths={2}` + `fixedWeeks` + clasa CSS `rdp-hide-past-weeks` care ascunde săptămânile trecute din prima lună. Cu `showOutsideDays` activ (implicit `true`), May 2026 afișează și zilele 1–6 iunie pe ultimul rând, iar headerul rămâne "May 2026". Practic e o singură pagină vizuală, fără separator între luni.

## Ce schimb
Toate modificările doar în `src/components/product/PremiumBookingCard.tsx` (și un mic ajustaj în `src/index.css` dacă e necesar pentru spacing).

1. **Adaug `showOutsideDays={false}`** pe `<CalendarComponent>`.
   - Efect: May 2026 se termină pe sâmbătă 30 mai, fără zilele 31 mai / 1–6 iun îmbârligate.

2. **Păstrez `numberOfMonths={2}`** ca să apară imediat dedesubt blocul "June 2026" cu propriul header (caption) și propria grilă. Asta e "breakul" — header nou cu luna + anul, separat de cel din May.

3. **Adaug spațiu vertical între luni**: schimb `classNames.months` din `flex flex-col gap-0` în `flex flex-col gap-4` și adaug o linie subtilă deasupra celei de-a doua luni (border-top + padding-top) via `classNames.month` sau un selector CSS în `index.css` (`.booking-cal-month + .booking-cal-month`).

4. **Caption mai vizibil**: stilizez `classNames.caption` cu `text-base font-semibold text-foreground` ca headerul de lună+an să iasă în evidență la fiecare break.

5. **Verific `rdp-hide-past-weeks`** în `index.css` — funcționează doar pe prima lună afișată; June rămâne complet vizibilă de la 1 la 30, ceea ce e ok.

## Rezultat vizual
```
May 2026             ← caption bold
Su Mo Tu We Th Fr Sa
       17 18 19 20 ... 30
─────────────────────  ← spațiu + linie subtilă
June 2026            ← caption bold (BREAK)
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 ...               27
```
Săptămânile suplimentare ale lui iunie sunt vizibile dacă utilizatorul are nevoie să selecteze și mai târziu (până la sfârșitul lunii iunie, eventual înainte cu `fixedWeeks` care va completa cu zile din iulie — dezactivat de `showOutsideDays={false}`).

## Notă
Nu schimb logica `disabled`/`fromMonth` și nu ating altă funcționalitate (selectare, modifiers, prețuri). Doar prezentarea calendarului.
