## Countdown până la returnare în header-ul rezervării

În `src/pages/RentalDetailPage.tsx`, lângă textul existent `19 mai 2026 – 19 mai 2026 · 1 zile`, adaug un badge live cu countdown până la `rental.end_date` (data de returnare stabilită de comun acord).

### Comportament

- **Înainte de start** (`now < start_date`): badge gri/neutru — `Începe în 3z 4h` (RO) / `Starts in 3d 4h` (EN).
- **În timpul închirierii** (`start_date ≤ now < end_date`): badge primary (#F59E0B/10) cu icon `Clock` — `Returnare în 2z 5h 12m` / `Return in 2d 5h 12m`.
- **Ultimele 24h**: badge devine roșu (`bg-destructive/10 text-destructive`) — `Returnare în 5h 12m`.
- **După `end_date`** dacă încă nu s-a făcut returnarea: badge roșu — `Întârziere: 1z 2h` / `Overdue: 1d 2h`.
- **Dacă PV returnare e semnat de ambele părți** (`returnDoneEarly === true`) sau `rental.status === "completed"` / `cancelled`: nu se afișează badge.

### Implementare tehnică

1. Component nou inline (sau mic helper) `ReturnCountdownBadge` în același fișier (sau `src/components/rentals/ReturnCountdownBadge.tsx`):
   - Props: `startDate: string`, `endDate: string`, `hidden: boolean`.
   - `useState` cu `now = Date.now()`, `useEffect` cu `setInterval(..., 60_000)` (refresh la 1 minut — suficient pentru d/h/m).
   - Calculează diff și formatează `Xz Yh Zm` (omite componente zero, max 3 unități).
2. Inserat după `{rental.rental_days} {t("zile", "days")}` în linia 196, separat printr-un `·` sau pe linie nouă pe mobil:
   ```tsx
   <span className="ml-2 inline-flex">
     <ReturnCountdownBadge startDate={rental.start_date} endDate={rental.end_date} hidden={returnDoneEarly || rental.status === "completed" || rental.status === "cancelled"} />
   </span>
   ```
3. Folosesc `Clock` din lucide-react (deja importat) și `cn` pentru variante de culoare.
4. Texte bilingve via `t()` din `useLanguage` (deja folosit în pagină).

### Out of scope

- Nu modific timeline, PV cards, business logic sau email-uri.
- Nu modific lista `/rezervari` sau `/inchirieri` — countdown apare doar pe pagina de detaliu.