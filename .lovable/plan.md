## Plan: Reminder 2h înainte de expirarea cererii (cu auto-refuz la 48h)

### Comportament
- Chiriașul trimite o cerere → status `pending`.
- La **46h** după `created_at`: reminder „mai ai 2 ore" către **proprietar** (in-app + email + SMS) și un reminder informativ pentru chiriaș.
- La **48h** după `created_at`: dacă tot e `pending`, sistemul:
  1. setează `status = cancelled`, `payment_status = refund_pending` (apoi `refunded`)
  2. eliberează hold-ul Stripe (cancel sau refund, exact ca în `respond-rental-request`)
  3. notifică ambele părți (in-app + email + SMS) că cererea a expirat automat

### 1. Înlocuire cron vechi
Dezactivez cron-ul `send-return-deadline-reminders-hourly` adăugat anterior (păstrăm edge function-ul + handler-ul, dar nu mai fire — codul rămâne disponibil pentru viitor).

### 2. Edge function nouă — `send-request-deadline-reminders`
Locație: `supabase/functions/send-request-deadline-reminders/index.ts`. Rulează la fiecare 15 min:

```
// Pseudo:
A. REMINDER:
   SELECT id FROM rentals
   WHERE status='pending'
     AND created_at <= now() - interval '46 hours'
     AND created_at >  now() - interval '48 hours'
   → pentru fiecare, dacă nu există audit log cu event_key='request_reminder_2h':
       invoke notify-rental-event { event_key: 'request_reminder_2h' }

B. AUTO-EXPIRE:
   SELECT id, payment_intent_id, payment_status FROM rentals
   WHERE status='pending'
     AND created_at <= now() - interval '48 hours'
   → pentru fiecare:
       1. UPDATE rentals SET status='cancelled', cancelled_at=now(),
          cancellation_reason='Cerere expirată automat (48h fără răspuns)',
          rejection_reason='Cerere expirată automat',
          payment_status = CASE WHEN payment_intent_id NOT NULL THEN 'refund_pending' ELSE payment_status END
       2. Stripe: cancel PI sau refund (same flow ca respond-rental-request)
       3. UPDATE rentals SET payment_status='refunded', refunded_at=now()
       4. UPDATE transactions SET status='cancelled' WHERE rental_id=... AND status='pending'
       5. invoke notify-rental-event { event_key: 'request_expired' }
```

Idempotență prin `notification_audit_log` (event_key) pentru reminder; pentru auto-expire, condiția `status='pending'` previne dublarea.

### 3. Handler-uri noi în `notify-rental-event/index.ts`

Adaug 2 chei în `EventKey` type și `EVENTS` map:

```ts
request_reminder_2h: {
  recipients: "both",  // text diferit pe rol
  channels: ["in_app", "email", "sms"],
  critical: true,
  emailTemplate: { owner: "request-reminder-2h-owner", renter: "request-reminder-2h-renter" },
  smsTemplate: { owner: "request_reminder_2h_owner", renter: "request_reminder_2h_renter" },
  inAppTitle: (c) => c.recipientRole === "owner"
    ? { ro: "⏰ Mai ai 2 ore să răspunzi", en: "⏰ 2 hours left to respond" }
    : { ro: "Cererea ta așteaptă răspuns", en: "Your request awaits a response" },
  inAppDesc: (c) => c.recipientRole === "owner"
    ? { ro: `Răspunde la cererea pentru "${c.product?.title}" sau va fi anulată automat`, en: `Respond to the request for "${c.product?.title}" or it will auto-cancel` }
    : { ro: `Așteptăm răspunsul proprietarului pentru "${c.product?.title}"`, en: `Awaiting owner response for "${c.product?.title}"` }),
  link: (c) => `/rezervari/${c.rental.public_id}`,
  smsPurpose: "view_rental",
},
request_expired: {
  recipients: "both",
  channels: ["in_app", "email", "sms"],
  critical: true,
  emailTemplate: { owner: "request-expired-owner", renter: "request-expired-renter" },
  smsTemplate: { owner: "request_expired_owner", renter: "request_expired_renter" },
  inAppTitle: { ro: "Cerere expirată automat", en: "Request auto-expired" },
  inAppDesc: (c) => ({ ro: `Cererea pentru "${c.product?.title}" a fost anulată (fără răspuns în 48h). Hold-ul a fost eliberat.`, en: `Request for "${c.product?.title}" was cancelled (no response in 48h). Hold released.` }),
  link: (c) => `/rezervari/${c.rental.public_id}`,
  smsPurpose: "view_rental",
},
```

### 4. Template-uri email noi (`_shared/transactional-email-templates/`)
- `request-reminder-2h-owner.tsx` — CTA „Acceptă/Refuză cererea acum"
- `request-reminder-2h-renter.tsx` — informativ „așteptăm răspunsul proprietarului"
- `request-expired-owner.tsx` — „cererea a expirat fără răspuns"
- `request-expired-renter.tsx` — „cererea a expirat, hold-ul a fost eliberat integral"

Toate înregistrate în `registry.ts`. Folosesc același stil/branding ca `rental-request-owner.tsx`.

### 5. Template-uri SMS noi în `send-sms-notification/index.ts`
- `request_reminder_2h_owner` — `"⏰ Rentli: mai ai 2h să răspunzi la cererea pentru {product}. {link}"`
- `request_reminder_2h_renter` — `"Rentli: așteptăm răspunsul proprietarului pentru {product}. {link}"`
- `request_expired_owner` — `"Rentli: cererea pentru {product} a expirat (48h fără răspuns)."`
- `request_expired_renter` — `"Rentli: cererea pentru {product} a expirat fără răspuns. Hold-ul Stripe a fost eliberat."`

### 6. Cron orar (de fapt la 15 min) — via `supabase--insert`
```sql
SELECT cron.unschedule('send-return-deadline-reminders-hourly');  -- safe
SELECT cron.unschedule('send-request-deadline-reminders');         -- defensiv
SELECT cron.schedule(
  'send-request-deadline-reminders',
  '*/15 * * * *',
  $$ SELECT net.http_post(
       url := '<project>/functions/v1/send-request-deadline-reminders',
       headers := '{"Content-Type":"application/json","apikey":"<ANON>","Authorization":"Bearer <ANON>"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```

### 7. Deploy
Deploy `send-request-deadline-reminders`, `notify-rental-event`, `send-sms-notification`, `send-transactional-email`.

### 8. Verificare
- Curl manual `/send-request-deadline-reminders?dry_run=1` (adaug param) ca să listez ce ar trimite, fără a face refund-uri reale.
- Verific `notification_audit_log` pentru event_key-urile noi.

### Ce nu modific
- Schema bazei (nu adaug coloane noi — folosesc `created_at` existent).
- Fluxul manual de accept/reject din `respond-rental-request` (rămâne identic).
- Codul existent pentru `return_reminder_2h` (rămâne în loc, doar fără cron).