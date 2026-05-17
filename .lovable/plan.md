## Context

Infrastructura există deja:
- Edge function `notify-rental-event` are configurate evenimentele `rental_completed` (email owner + renter + SMS + in-app) și `review_reminder` (email cu link spre review + in-app).
- Template-urile `rental-completed-owner`, `rental-completed-renter`, `review-reminder` sunt în registry. SMS-urile `rental_completed` și `review_reminder` sunt în `send-sms-notification`.
- Link-ul de review din email duce la `/rezervari?rental_id=…&review=1`.

Singura piesă lipsă: când proprietarul apasă "Confirmă returnarea" în `confirmReturn()` (`src/features/rentals/ownerRentalsApi.ts`), rental-ul trece pe `completed`, dar nu se emite niciun event de notificare. Asta înseamnă că nici emailurile/SMS-urile de finalizare, nici reminder-ul de review nu pleacă.

## Modificare

**`src/features/rentals/ownerRentalsApi.ts` — funcția `confirmReturn`**

După update-ul reușit pe `rentals` (status → `completed`), apelez best-effort (non-blocant, ca la `confirmPickupArrangement`):

1. `notify-rental-event` cu `event_key: "rental_completed"` → trimite email branded + SMS + in-app ambelor părți, cu mesaj de "Închiriere finalizată" și link spre rezervare.
2. `notify-rental-event` cu `event_key: "review_reminder"` → trimite emailul "Lasă un review" cu CTA către `/rezervari?rental_id={id}&review=1` ambelor părți + notificare in-app.

Ambele apelate cu `.catch()` ca să nu blocheze flow-ul UI dacă pică livrarea.

## Notă

Nu schimb nimic în template-uri, în `notify-rental-event` sau în `send-sms-notification` — totul există deja, doar conectez trigger-ul. Fluxul end-to-end devine: proprietar confirmă returnarea → captură Stripe → status `completed` → email + SMS de finalizare → email + in-app cu link de review pentru fiecare parte.
