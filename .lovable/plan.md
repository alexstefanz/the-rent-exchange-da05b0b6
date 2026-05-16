## Problema
Pe `RNT-000077` predarea (handover PV) a fost semnată de ambele părți pe 16 mai, dar perioada de închiriere e 26–27 mai (pickup făcut mai devreme). Cardul „Vrei să predai produsul înainte de termen?" nu apare.

Cauza, în `src/components/rentals/EarlyReturnCard.tsx` (linia 64–68 + 182):
```ts
const inWindow = today > start && today < end;
...
if (!inWindow) return null;
```
Pentru RNT-000077, `today (16 mai) < start (26 mai)` ⇒ `inWindow = false` ⇒ cardul e ascuns, deși produsul e deja la chiriaș.

În același timp, în `RentalDetailPage.tsx` cardul e deja gardat corect de:
```
handoverDoneEarly && !returnDoneEarly && status !== completed/cancelled
```
care e adevărat acum pentru RNT-000077. Deci gardarea pe `start_date` din interiorul cardului e redundantă și greșită pentru cazurile de predare anticipată.

## Soluție

### `src/components/rentals/EarlyReturnCard.tsx`

1. **Elimină gardarea pe `inWindow`** pentru afișarea cardului-prompt. Componenta se mai afișează când părintele decide că predarea e făcută și returul nu e încă făcut. Concret: șterge `if (!inWindow) return null;`.

2. **Recalculează ferestrele calendarului** ca să accepte și scenariul „handover înainte de start_date":
   - `earliest` = `max(today, addDays(start,1))` rămâne valabil în cazul normal; pentru predare anticipată, `earliest` devine practic `today` (azi sau mâine în funcție de regulă) — folosim `earliest = today` (chiriașul poate returna oricând după ce a luat produsul).
   - `maxDate` = `addDays(end, -1)` rămâne — nu are sens „early return" în chiar ultima zi sau după.
   - Dacă `today >= end` (deja peste termen), ascundem cardul-prompt (nu mai e „early") — `return null`.

3. **Calcul subtotal nou (`newDays`)** — în loc de `differenceInCalendarDays(selectedDate, start) + 1`, folosim `max(1, differenceInCalendarDays(selectedDate, start) + 1)` ca să nu obținem zile negative când `selectedDate < start` (predare înainte chiar de a începe oficial). Astfel `newSubtotal` minim = `dailyPrice`.

4. **Mesajul din `DialogDescription`** — în loc de „între `minDate` și `maxDate`" (care poate fi în viitor față de azi), arătăm intervalul efectiv calendar: „între `format(earliest)` și `format(maxDate)`".

### În afara scopului
- Nu schimbăm edge function-ul `request-early-return` (acceptă orice `newEndDate` validat server-side).
- Nu modificăm logica din `RentalDetailPage.tsx` — gardarea de acolo e corectă.
- Nu atingem `EarlyReturnResponseCard` / fluxul de aprobare.
