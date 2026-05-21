## Plan: Activare reminder 2h înainte de deadline-ul închirierii

### Diagnostic
Infrastructura există deja, dar **nu rulează automat**:
- ✅ Edge function `send-return-deadline-reminders` — scanează închirierile cu `end_date = azi` la ora 22:00 Europe/Bucharest (~2h înainte de miezul nopții) și trimite eveniment pentru fiecare.
- ✅ Handler `notify-rental-event` are configurat evenimentul `return_reminder_2h` cu `critical: true` și 3 canale: `in_app`, `email`, `sms` — pentru ambele părți (chiriaș + proprietar).
- ✅ Template email `return-deadline-2h.tsx` înregistrat.
- ✅ Template SMS `return_deadline_2h` (chiriaș) și `return_deadline_2h_owner` (proprietar) înregistrate.
- ✅ Texte in-app: "⏰ Mai sunt 2 ore până la deadline" + descriere produs.
- ✅ Idempotență prin `notification_audit_log` (event_key = `return_reminder_2h`).
- ❌ **Lipsește cron job-ul pg_cron** — funcția nu e invocată niciodată.

### Acțiune
**1. Programare cron orară pentru `send-return-deadline-reminders`**

Folosesc `supabase--insert` (nu migrație, pentru că conține URL + ANON key specifice proiectului — vezi regula din knowledge base). Cron-ul rulează la `:05` în fiecare oră; funcția face self-gating intern la ora 22 Europe/Bucharest, deci e safe să o invoci des.

```sql
select cron.schedule(
  'send-return-deadline-reminders-hourly',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/send-return-deadline-reminders',
    headers := '{"Content-Type":"application/json","apikey":"<ANON>","Authorization":"Bearer <ANON>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Înainte de schedule, fac `cron.unschedule` defensiv pentru a evita duplicate.

**2. Verificare**
- Apel manual: `supabase--curl_edge_functions` la `/send-return-deadline-reminders?force=1` pentru a confirma traseul end-to-end (in_app + email pentru o închiriere de test).

### Notă
- Nu modific cod aplicație — totul există.
- Nu adaug fișiere noi de template.
- SMS-ul efectiv depinde de configurarea provider-ului existent (deja folosit pentru `return_reminder_24h`, deci ok).