## Calendar „Blochează zile indisponibile" — selecție zi cu zi sau interval

### Problemă
Calendarul actual folosește `mode="multiple"` și are 2 bug-uri:
1. **Doar selecție individuală** — nu poți marca un interval rapid (ex: vacanță 10–20 mai).
2. **Bug de fus orar:** `d.toISOString().slice(0,10)` convertește în UTC, deci o zi selectată la ora locală (ex: 10 mai noaptea în RO) se salvează ca 9 mai → ziua aprinsă vizual nu corespunde cu cea salvată.

### Soluție

În `src/components/publish/PublishWizard.tsx`, în secțiunea „Blochează zile indisponibile":

1. **Toggle de mod** sus în card, cu 2 butoane segmentate:
   - „Zile individuale" (default) — comportamentul actual `mode="multiple"`
   - „Interval" — `mode="range"`, alegi start + end, iar la confirmare toate zilele din interval se adaugă în `blocked_dates` (merge cu cele existente, fără duplicate).

2. **În mod „Interval":**
   - După ce sunt selectate ambele capete, apare un buton primary „Adaugă X zile blocate" care expandează intervalul în zile individuale și le adaugă peste cele existente.
   - Sub calendar, listă compactă cu chips-uri pentru zilele blocate (format scurt: `10 Mai`), fiecare cu `X` pentru ștergere individuală.

3. **Fix fus orar:** înlocuiesc `toISOString().slice(0,10)` cu o funcție `formatLocalDate(d)` care construiește `YYYY-MM-DD` din `getFullYear/getMonth/getDate` locale, și parsing-ul invers din `YYYY-MM-DD` într-un `Date` la ora locală (nu `new Date("2026-05-10")` care e UTC).

4. **Buton „Șterge tot"** când există ≥1 zi blocată.

5. **Counter** în header (păstrat) + textul „X zile blocate" sub toggle.

### Detalii tehnice
- State local nou pentru `selectMode: "single" | "range"` și `pendingRange: DateRange | undefined`.
- Helper-i puri în același fișier (nu fișier nou): `formatLocalDate`, `parseLocalDate`, `expandRange(start, end)`.
- Tipul `DateRange` din `react-day-picker` (deja folosit în proiect).
- Storage și schema rămân neschimbate (`blocked_dates: string[]` în format `YYYY-MM-DD`).

### Ce NU se schimbă
- API-ul `update("blocked_dates", ...)` și forma datelor.
- Backend, RLS, RPC-uri.
- Restul wizard-ului.
