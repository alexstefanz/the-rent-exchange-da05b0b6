## Problem

Pe pagina de produs, dacă utilizatorul dă click pe o singură zi în calendar, butonul de rezervare rămâne dezactivat ("Verifică datele") și nu se poate face rezervarea de 1 zi.

**Cauza:** Calendar-ul (`PremiumBookingCard.tsx`) e folosit în `mode="single"`. Logica din `handleDateSelect` (`src/pages/ProductDetail.tsx`, linia 140) setează doar `startDate` la primul click și așteaptă un al doilea click pentru `endDate`. Butonul "Rezervă acum" e activ doar când există **și** `startDate` **și** `endDate` (linia 118 din `PremiumBookingCard.tsx`).

În plus, react-day-picker în `mode="single"` deselectează când dai click pe aceeași zi a doua oară, deci ramura `date.getTime() === startDate.getTime()` (linia 143) practic nu se declanșează — `onSelect` primește `undefined` și funcția iese imediat.

## Soluție propusă

Modific `handleDateSelect` în `src/pages/ProductDetail.tsx` astfel încât:

1. **Primul click pe o zi** → setează `startDate = date` **și** `endDate = date` (rezervare implicită de 1 zi). Butonul "Rezervă acum" devine activ instant.
2. **Al doilea click pe altă zi** (când `startDate === endDate`) → extinde intervalul:
   - dacă noua dată e după `startDate` și nu există zile rezervate în interval → `setEndDate(date)`
   - dacă noua dată e înainte de `startDate` → `setStartDate(date)` și `endDate` rămâne ca capăt
   - dacă există conflict cu zile rezervate → toast existent
3. **Al treilea click** (când avem deja un interval >1 zi) → resetează: `startDate = date`, `endDate = date` (din nou rezervare 1 zi).

`clearDates` și restul logicii (preț, breakdown, validare booked) rămân neschimbate. Breakdown-ul afișează deja corect "1 zile × X RON" când start = end (vezi `computeRentalPrice` apelat la linia 38 din `PremiumBookingCard.tsx`).

## Fișier modificat

- `src/pages/ProductDetail.tsx` — rescriu funcția `handleDateSelect` (liniile 140-152). Nicio altă modificare.

## Ce nu se schimbă

- `PremiumBookingCard.tsx` rămâne cu `mode="single"` și aceeași condiție pe buton (`disabled={!startDate || !endDate}`) — se va activa natural pentru că ambele sunt setate de la primul click.
- Logica de prețuri, RPC-ul `get_booked_dates`, validarea conflictelor în interval.