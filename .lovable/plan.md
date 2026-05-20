## Notificare "Deadline 2h" înainte de finalul închirierii

### Context
- Avem deja `return_reminder_24h` (cron zilnic) și `notify-return-day` (chiar în ziua returnării). Lipsește un reminder urgent cu ~2h înainte de deadline.
- `rentals.end_date` este de tip `date` (fără oră), așa că tratăm deadline-ul ca **finalul zilei `end_date`** (miezul nopții următoare), exact cum face deja `ReturnCountdownBadge`. "2h înainte" = **22:00 ora României, în ziua `end_date`**.
- Trimitem doar pentru închirieri `status = 'active'` și fără `return_confirmed_at`.

### 1. Event nou în `notify-rental-event`
Adăugăm `return_reminder_2h` în `EventKey` și în `EVENTS`:
- `recipients: "both"`, `channels: ["in_app", "email", "sms"]`, `critical: true`
- Titlu in-app RO: „⏰ Mai sunt 2 ore până la deadline" / EN: „⏰ 2 hours left until deadline"
- Descriere: `Returnează "{product}" până la miezul nopții pentru a evita penalizările.`
- Link: `/rezervari/{public_id}`
- Email: șablon nou `return-deadline-2h` (variantă mai urgentă a `return-reminder`)
- SMS: șablon nou `return_deadline_2h` (text scurt, urgent, cu numele produsului și proprietarului)

### 2. Email + SMS templates
- **Email**: copiem `supabase/functions/_shared/transactional-email-templates/return-reminder.tsx` în `return-deadline-2h.tsx` cu titlu/CTA în roșu/urgent („Returnează în următoarele 2 ore"), îl înregistrăm în `registry.ts`.
- **SMS**: adăugăm cheia `return_deadline_2h` lângă `return_reminder` (text de ~140 caractere, bilingv RO).

### 3. Edge function nouă: `send-return-deadline-reminders`
- Cron-invoked, rulează **din oră în oră** (ca să prindă fereastra 22:00 Europe/Bucharest indiferent de DST).
- Logică:
  1. Calculează ora curentă în `Europe/Bucharest`. Dacă nu e ora 22 → exit `{skipped: true}`.
  2. `today = data curentă în Europe/Bucharest` (YYYY-MM-DD).
  3. Selectează `rentals` cu `status='active'`, `end_date = today`, `return_confirmed_at IS NULL`.
  4. Idempotent prin `notification_audit_log` (`event_key = return_reminder_2h`, `status in ('sent','delivered')`).
  5. Pentru fiecare rezervare → `supabase.functions.invoke("notify-rental-event", { rental_id, event_key: "return_reminder_2h" })`.
- Returnează `{ ok, candidates, sent }`.

### 4. Programare cron (rulat prin `supabase--insert`, nu prin migrație)
```sql
select cron.schedule(
  'send-return-deadline-reminders-hourly',
  '0 * * * *',
  $$ select net.http_post(
       url:='https://<project>.supabase.co/functions/v1/send-return-deadline-reminders',
       headers:='{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body:='{}'::jsonb
     ); $$
);
```
Verificăm `pg_cron` și `pg_net` activate; dacă lipsesc, le activăm.

### 5. Fără modificări în frontend
Notificarea apare automat în `NotificationCenter` (folosește deja `type` pentru icon/stil via `notificationCategory`). Nu schimbăm logică de business.

### Detalii tehnice
- Toate canalele respectă deja `notification_preferences` și banii pentru rate-limit existente.
- `idempotencyKey` pentru email/SMS rămâne formatul standard: `return_reminder_2h:{rental_id}:{user_id}` (logica e în `notify-rental-event`).
- Nu modificăm `send-return-reminders` (24h) și nici `notify-return-day` — sunt complementare.