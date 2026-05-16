Extind comportamentul „back din chat → pagina sursă” și pentru celelalte locuri care deschid o conversație specifică prin `navigate('/mesaje?conv=...')`.

Locuri vizate (toate trimit deja un `conv` în URL, deci au sens pentru back):
1. `src/pages/RentalDetailPage.tsx` (linia 175) — chat deschis dintr-o rezervare/închiriere → back la `/rezervari/:publicId` sau `/inchirieri/:publicId`.
2. `src/components/admin/AdminCancellationRequestsPanel.tsx` (linia 92) — back la `/admin/approvals?tab=cancellations` (pagina curentă).
3. `src/components/dashboard/AcceptedRentalDialog.tsx` (linia 72) — back la pagina pe care era dialogul (ex. `/rezervari`).
4. `src/components/booking/BookingConfirmation.tsx` (linia 33) — back la pagina pe care a apărut confirmarea.
5. `src/components/dashboard/PickupArrangementCard.tsx` (linia 80) — back la pagina cu cardul (rental detail / dashboard).
6. `src/components/profile/NotificationsTab.tsx` (linia 170) — back la `/notificari`.

Pentru fiecare, voi adăuga `{ state: { returnTo: { pathname: window.location.pathname, search: window.location.search } } }` la apelul `navigate`. Logica de back din `Messages.tsx` (deja implementată) folosește acest `returnTo` și restaurează corect pagina anterioară.

Nu modific:
- `navigate("/mesaje")` (fără `conv`) — deschide direct lista, nu are sens returnTo.
- Backend, RPC-uri sau RLS.
- Comportamentul când utilizatorul intră direct pe `/mesaje?conv=...` (rămâne fallback la lista de mesaje).