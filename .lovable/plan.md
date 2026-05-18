## Audit — sistemul există deja, doar îl curățăm

Infrastructura de notificări către **ambele părți** la fiecare schimbare din timeline e deja completă:

```text
acțiune → notify-rental-event (recipients: "both")
        → INSERT public.notifications (un rând per user)
        → realtime INSERT → useGlobalRealtime → notify card (bottom-center)
```

Evenimente care fac deja insert în `notifications` pentru ambii utilizatori (verificat în `notify-rental-event/index.ts`):

- `request_created`, `request_accepted`, `payment_succeeded`, `pickup_scheduled`
- `pv_pickup_pending`, `pv_pickup_completed_by_party`, `handover_confirmed`, `active_rental_started`
- `return_in_progress`, `pv_return_pending`, `pv_return_completed_by_party`, `rental_completed`
- `cancel_request_submitted`, `cancel_request_withdrawn`, `cancel_request_approved`, `cancel_request_rejected`, `cancellation_confirmed`, `mutual_cancel_approved`
- excepții (singura parte): `request_rejected` → doar renter, `request_cancelled_by_renter` → doar owner

Tranziții automate (handover, active, return_pending, completed) sunt emise dintr-un trigger DB (`rentals_notify_status`) — deci se aplică indiferent dacă acțiunea vine din UI sau cron.

### Schimbarea concretă necesară

**1. Eliminăm toast-ul local din `src/pages/Checkout.tsx` (`notify.rental(...)`)** — chiriașul îl primește deja prin realtime din `request_created`, iar acum apare de două ori. Înlocuim doar cu `navigate(...)` direct către `/rezervari/:id`. Confirmarea vizuală a trimiterii rămâne prin toast-ul realtime + redirecționarea spre pagina rezervării.

**2. Adăugăm câteva chei lipsă pentru toast-ul realtime** în `src/lib/notify.tsx` → `variantFromNotificationType`:

- `active_rental_started`, `handover_confirmed`, `rental_completed`, `review_reminder` → `confirmation` (verde)
- `return_reminder_24h`, `return_in_progress`, `pv_pickup_pending`, `pv_return_pending`, `pv_pickup_completed_by_party`, `pv_return_completed_by_party`, `pickup_scheduled` → `system` (albastru)
- `dispute_opened` → `cancellation` (roșu)

Tot ce e deja mapat (cancel/reject/payment/etc.) rămâne neschimbat.

### Verificare după implementare

- Test manual: o cerere nouă din Checkout → renter vede UN singur toast (din realtime), owner vede toast la `request_created`.
- Owner acceptă/refuză → ambele părți primesc toast corespunzător (verde / roșu).
- PV-uri și tranziții status — emise de trigger-ul DB existent, ambele părți primesc toast din realtime.

Nu sunt necesare modificări la edge functions, la baza de date sau la `notify-rental-event` — toate evenimentele sunt deja configurate cu `recipients: "both"` acolo unde trebuie.
