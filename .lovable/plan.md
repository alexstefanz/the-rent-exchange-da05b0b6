## Cauză

Funcția edge `notify-rental-event` nu cunoaște event_key-ul `request_cancelled_by_renter` (nu apare în tipul `EventKey` și nici în map-ul `EVENTS`), deci apelul făcut de `renterCancelUnpaidRental` returnează 400 și nu se trimite nicio notificare. Pentru RNT-000093 anularea a avut loc (status `cancelled`, `cancellation_reason = renter_self_unpaid`), dar proprietarul nu a fost informat.

## Fix

1) **Adaug eventul în `supabase/functions/notify-rental-event/index.ts`:**
   - Adaug `"request_cancelled_by_renter"` în `type EventKey`.
   - Adaug intrare în `EVENTS`:
     - `recipients: "owner"` (chiriașul a inițiat acțiunea, doar proprietarul trebuie notificat)
     - `channels: ["in_app", "email", "sms"]`, `critical: true`
     - `emailTemplate: { owner: "rental-rejected" }` (reutilizez template-ul existent „cerere refuzată / anulată" — același mesaj transmite anularea înainte de plată); dacă nu există, fallback pe in-app + sms.
     - `smsTemplate: "rental_rejected"`
     - Titlu/desc RO: „Cerere de închiriere anulată" / „Chiriașul a anulat cererea pentru „{product}" înainte de plată".
     - `link`: `/rezervari/{public_id}`

2) **Re-trimit notificarea pentru RNT-000093** după ce funcția este deployată (apel manual `curl_edge_functions` cu `rental_id` și `event_key: "request_cancelled_by_renter"`), astfel încât proprietarul rentalului existent să primească în‑app + email + SMS.

Niciun alt cod nu se schimbă: `renterCancelUnpaidRental` deja invocă funcția cu acest event_key, deci viitoarele anulări vor declanșa automat notificarea.