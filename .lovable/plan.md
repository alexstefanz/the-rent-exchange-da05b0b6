## Obiectiv

Notifică ambele părți (in-app + email + SMS) la fiecare etapă critică a unei închirieri Rentli, cu link-uri securizate, audit log, retry safety și preferințe per utilizator (cu notificări obligatorii pentru siguranță/PV).

## Ce există deja

- Email infra: `send-transactional-email` + 25 template-uri React Email (rental-accepted, rental-rejected, rental-request-owner/renter etc.) prin pgmq.
- SMS infra: `send-sms-notification` (smsalert.mobi, normalizează RO, GSM-7) cu template-uri pentru: request_owner, accepted, rejected, cancelled, return_reminder.
- Orchestrator parțial: `send-rental-notification` (cerere nouă) și `send-pickup-reminders` (cron 12h).
- Tabela `notifications` (in-app realtime).

## Ce lipsește

1. **Orchestrator centralizat** pentru toate evenimentele de rental — momentan logica e împrăștiată.
2. **Template-uri email noi** pentru: pickup_scheduled, pv_pending (predare/returnare), pv_completed_by_party, handover_confirmed, active_rental_summary, return_in_progress, rental_completed_owner, rental_completed_renter, review_reminder, dispute_opened.
3. **Template-uri SMS noi** pentru: pickup_scheduled, pv_pending, pv_other_party_done, return_in_progress, rental_completed, dispute_opened, review_reminder.
4. **Audit log** centralizat pentru fiecare notificare (canal, status, timestamp, eroare).
5. **Preferințe utilizator** (email/SMS opt-out) cu override pentru notificări critice.
6. **Link-uri securizate** scurte cu expirare pentru SMS (deep-link către /rezervari/:id sau /pv/:rentalId/:phase).
7. **Triggers** la nivel DB / RPC pentru tranzițiile de status care nu au orchestrare.

## Plan tehnic

### 1. Bază de date (migrare)

- `notification_audit_log` — coloane: `id`, `rental_id`, `user_id`, `event_key`, `channel` (in_app/email/sms), `status` (pending/sent/delivered/failed), `provider_id`, `error`, `payload jsonb`, `created_at`. RLS: utilizatorul vede doar propriile linii; admin vede tot.
- `notification_preferences` — coloane: `user_id`, `email_marketing bool default true`, `sms_marketing bool default true`, `email_transactional bool default true` (read-only în UI; doar admin), `sms_transactional bool default true`. Critical events (pv_pending, dispute, handover) ignoră flag-urile.
- `secure_action_tokens` — `token (text pk)`, `rental_id`, `user_id`, `purpose` (pv_pickup, pv_return, accept_request, view_rental), `expires_at`, `used_at`. Generate la trimitere SMS.

### 2. Edge function nouă: `notify-rental-event`

Single entry point. Acceptă body:
```
{ rental_id, event_key, actor_id?, extra? }
```
Event keys (matricea din cerere):
`request_created`, `request_accepted`, `request_rejected`, `pickup_scheduled`, `pv_pickup_pending`, `pv_pickup_completed_by_party`, `handover_confirmed`, `active_rental_started`, `return_reminder_24h`, `return_in_progress`, `pv_return_pending`, `pv_return_completed_by_party`, `rental_completed`, `review_reminder`, `dispute_opened`.

Pentru fiecare event:
1. Determină destinatarii (owner/renter/ambele) și canalele (din matrice).
2. Verifică `notification_preferences` (skip email/SMS dacă opt-out și event NU e critic).
3. Generează token securizat dacă SMS-ul are deep link.
4. În paralel:
   - Insert în `notifications` (in-app, realtime).
   - Invocă `send-transactional-email` cu template + `idempotencyKey = ${rental_id}-${event_key}-${user_id}`.
   - Invocă `send-sms-notification` cu template SMS + link scurt.
5. Scrie audit log per canal.
6. Idempotency: skip dacă există deja audit cu același (rental_id, event_key, user_id, channel) și status final.

### 3. Template-uri noi

**Email (React Email)** — fiecare cu card produs, perioadă, status, CTA mare, suport, footer:
- `pickup-scheduled.tsx` (ambele părți)
- `pv-pickup-pending.tsx` (ambele)
- `pv-completed-by-other.tsx` (cealaltă parte)
- `handover-confirmed.tsx` (ambele)
- `active-rental-summary.tsx` (ambele)
- `return-reminder-24h.tsx` (ambele)
- `return-in-progress.tsx` (ambele)
- `pv-return-pending.tsx` (ambele)
- `rental-completed-owner.tsx` (sumar câștiguri + CTA wallet/review)
- `rental-completed-renter.tsx` (sumar plată + CTA review)
- `review-reminder.tsx` (ambele, separate)
- `dispute-opened.tsx` (ambele + admin)

Toate înregistrate în `_shared/transactional-email-templates/registry.ts`. Folosesc `_components.tsx` existent pentru consistență vizuală (logo Rentli, primary #F59E0B, Plus Jakarta Sans).

**SMS** — extind `send-sms-notification` cu noi `TemplateKey`:
- `pickup_scheduled`: "Rentli: predare [produs] [data] [ora] la [loc]. Detalii: [link]"
- `pv_pending`: "Rentli: completeaza procesul verbal pentru [produs]. Link: [link]"
- `pv_other_done`: "Rentli: [Nume] a completat PV-ul. Verifica: [link]"
- `return_in_progress`: "Rentli: returnare [produs] - completeaza PV. Link: [link]"
- `rental_completed`: "Rentli: inchirierea [produs] s-a finalizat. Detalii: [link]"
- `dispute_opened`: "Rentli: disputa deschisa pentru [produs]. Suport: [link]"
- `review_reminder`: "Rentli: lasa un review pentru [produs]. [link]"

Link-urile sunt scurte: `https://rentli.ro/a/[token8]` → resolver edge function `resolve-action-token` care validează token-ul, marchează `used_at` și redirecționează.

### 4. Edge function nouă: `resolve-action-token`

GET `/resolve-action-token?t=XXXX` → validează expirare/folosire, redirect 302 către URL-ul real (`/rezervari/:id`, `/inspections/:id` etc.) cu auth-required guard în frontend.

### 5. Triggere — unde apelăm `notify-rental-event`

| Event | Trigger point |
|---|---|
| request_created | `verify-stripe-payment` / `send-rental-notification` (existent → înlocuit cu apel către orchestrator) |
| request_accepted/rejected | `respond-rental-request` |
| pickup_scheduled | RPC `confirm_pickup` (DB trigger sau invocare după RPC) |
| pv_pickup_pending | trigger pe `rentals.status` → `handover_pending` |
| pv_completed_by_party | trigger pe insert în `rental_inspections` |
| handover_confirmed | trigger status `active_rental` |
| active_rental_started | identic, email separat |
| return_reminder_24h | extinde `send-pickup-reminders` (deja cron) cu logica de returnare |
| return_in_progress | trigger status `return_pending` |
| pv_return_completed_by_party | trigger insert inspection phase=return |
| rental_completed | trigger status `completed` |
| review_reminder | cron nou `review-reminders-cron` (la 24h și 72h dacă nu există review) |
| dispute_opened | RPC `open_rental_dispute` |

DB triggers vor folosi `pg_net.http_post` către `notify-rental-event` (pattern existent în proiect).

### 6. UI — preferințe notificări

Pagina nouă `/setari/notificari` (sau în `/setari` existent) cu toggle-uri:
- Email marketing
- SMS marketing
- Email tranzacțional non-critic
- SMS tranzacțional non-critic

Notă vizibilă: "Notificările critice (proces verbal, dispute, siguranță) nu pot fi dezactivate."

### 7. Admin — audit log viewer

Tab nou în Admin ERP `/admin/notificari` cu listă filtrabilă din `notification_audit_log` (rental, user, event, canal, status, eroare). Util pentru debug deliverability.

## Out of scope (acum)

- Webhook delivery confirmations de la SMSAlert (status=delivered/failed) — adăugăm doar dacă API-ul suportă; altfel rămâne `sent`.
- Push notifications (mobile) — viitor.
- Internaționalizare SMS (rămâne RO fără diacritice).

## Întrebări înainte de implementare

1. Confirm că folosim **același provider SMS** (smsalert.mobi) deja configurat — sau vrei să evaluăm Twilio pentru delivery receipts?
2. Pentru link-urile scurte din SMS: vrei să folosim domeniul `rentli.ro/a/...` (necesită route în React app + edge function resolver) sau un subdomeniu dedicat (ex. `l.rentli.ro`)?
3. Review reminder: trimitere o singură dată (24h după finalizare) sau două (24h + 72h)?
