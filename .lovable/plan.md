## Problem

În calendarul produsului (`PremiumBookingCard`), luna iunie apare goală (doar antetul "June 2026" și zilele săptămânii, fără numere). Cauza:

- Produsul are o rezervare `confirmed` 1 iunie – 10 iulie 2026, deci toate zilele din iunie sunt `disabled`.
- În `src/index.css` (linia 249) există regula:
  ```css
  .rdp-hide-past-weeks .booking-cal-row:not(:has(button:not([disabled]))) { display: none; }
  ```
  Scopul inițial era să ascundă săptămânile complet din trecut, dar regula ascunde **orice** rând în care toate zilele sunt disabled — inclusiv săptămâni viitoare complet rezervate. Rezultatul: în iunie toate rândurile dispar.

Am verificat în DB: doar acest produs are în prezent o rezervare lungă care declanșează bug-ul, dar problema afectează potențial orice produs cu o săptămână întreagă blocată/rezervată.

## Fix

Diferențiez "zilele din trecut" de "zilele rezervate", ca să ascund din CSS doar săptămânile complet trecute, nu și pe cele complet rezervate.

1. **`src/components/product/PremiumBookingCard.tsx`**
   - Adaug un modifier `past` în `<CalendarComponent>` pentru zilele de dinainte de azi (`d => isBefore(d, startOfToday())`).
   - Las `disabled` neschimbat (past sau booked → nealegibil).
   - Adaug în `modifiersClassNames` (sau prin `classNames.day_…` echivalent) o clasă marker `day-past` pentru zilele din trecut.

2. **`src/index.css`** (linia 245-251)
   - Schimb selectorul ca să ascundă doar rândurile în care **fiecare** zi este `.day-past` (nu doar `disabled`):
     ```css
     .rdp-hide-past-weeks .booking-cal-row:not(:has(button:not(.day-past))) { display: none; }
     ```
   - Astfel săptămânile complet în trecut rămân ascunse, dar săptămânile viitoare complet rezervate se afișează (cu zile vizibile, opacitate redusă, tăiate — exact ca legenda "Rezervat").

## Out of scope

Nu schimb logica de rezervări, RPC-ul `get_booked_dates`, stilistica generală a calendarului sau alte ecrane (calendarul din `ListingAvailabilityDialog` folosește componenta standard fără regula `rdp-hide-past-weeks`, deci nu e afectat).
