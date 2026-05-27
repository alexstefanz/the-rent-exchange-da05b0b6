## Obiectiv

Fiecare SMS legat de o închiriere (cerere, acceptare, refuz, plată, predare, returnare, finalizare, recenzie, expirare) trebuie să conțină un link către pagina rezervării/închirierii respective, inclusiv mesajele finale de notificare.

## Situația actuală

`supabase/functions/send-sms-notification/index.ts` definește 22 de șabloane SMS. Probleme:

1. Mai multe șabloane nu conțin link deloc:
   - `rental_rejected`, `rental_cancelled_owner`, `return_reminder`, `return_reminder_owner`, `request_expired_owner`, `request_expired_renter`
2. Alte șabloane folosesc paths statice (`rentli.ro/rezervari`, `rentli.ro/inchirieri`) fără `rental_id`, deci utilizatorul aterizează pe lista generală în loc de rezervarea specifică:
   - `rental_request_owner`, `rental_request_renter`, `rental_accepted`, `rental_accepted_owner`, `rental_cancelled`
3. `notify-rental-event` deja construiește un `smsLink` corect (token securizat sau `APP_URL + linkPath` cu `rental_id`) și îl pasează ca `variables.link`, dar majoritatea șabloanelor de mai sus ignoră această variabilă.
4. Apelanții izolați (`send-cancellation-notification`, `notify-return-day`) nu trimit `variables.link`.

## Modificări propuse

### 1. `supabase/functions/send-sms-notification/index.ts`

- Calculează un link implicit per rol/template când `variables.link` lipsește, folosind `rentalId`:
  - chiriaș (renter) → `rentli.ro/rezervari?rental_id=<id>`
  - proprietar (owner) → `rentli.ro/inchirieri?rental_id=<id>`
  - fallback fără `rentalId` → ruta listă existentă.
- Rescrie toate cele 22 de șabloane astfel încât să se termine cu `${link}` (sau `Detalii: ${link}`), inclusiv:
  - `rental_rejected`, `rental_cancelled_owner`, `return_reminder`, `return_reminder_owner`, `request_expired_owner`, `request_expired_renter` care acum nu au niciun link.
  - `rental_request_owner/renter`, `rental_accepted(_owner)`, `rental_cancelled`, `rental_completed`, `review_reminder` să folosească `${link}` în loc de paths statice.
- Păstrează limita ~160 caractere (GSM-7) prin scurtarea textului acolo unde e nevoie; linkurile securizate `rentli.ro/a/<token>` sunt deja scurte.
- Păstrează `stripDiacritics` și logica de provider neschimbate.

### 2. `supabase/functions/notify-rental-event/index.ts`

- Niciuna funcțională: deja calculează `smsLink` corect și îl trimite. Singura ajustare: dacă `linkPath` pentru un eveniment nu conține `rental_id`, comutăm pe ruta cu `?rental_id=<id>` corespunzătoare rolului. (Audit rapid al map-ării event→linkPath pentru completitudine.)

### 3. `supabase/functions/notify-return-day/index.ts`

- La invocarea `send-sms-notification` adaugă `variables.link = ${APP_URL}/rezervari?rental_id=${r.id}` (renter) pentru template-ul `return_reminder`.

### 4. `supabase/functions/send-cancellation-notification/index.ts`

- La trimiterea `rental_cancelled` adaugă `variables.link` cu `rental_id` (rol = chiriaș). Verifică dacă există și varianta către proprietar și aplică similar.

### 5. Deploy

- `deploy_edge_functions(["send-sms-notification", "notify-rental-event", "notify-return-day", "send-cancellation-notification"])`.

### 6. Verificare

- Test smoke prin `supabase--curl_edge_functions` pe `send-sms-notification` cu `phoneOverride` (admin) pentru 3 template-uri reprezentative: `rental_request_owner`, `rental_rejected`, `rental_completed` — confirmă că `message_body` din `sms_logs` se termină cu linkul corect (rental_id sau token).

## În afara scopului

- Schimbări la canalele email / in-app.
- Modificarea politicii de tokenizare (`secure_action_tokens`) — folosim infrastructura existentă.
- Adăugarea de șabloane SMS noi.
