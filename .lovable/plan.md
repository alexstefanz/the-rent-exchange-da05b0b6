## Pas următor: adaug `RESEND_WEBHOOK_SECRET`

Îți deschid form-ul securizat pentru a introduce signing secret-ul (`whsec_...`) primit de la Resend. După ce-l introduci:

1. Creez funcția edge `resend-webhook` (public, `verify_jwt = false`) cu verificare semnătură via `svix`.
2. Procesare evenimente:
   - `email.delivered` → update `email_send_log` status `sent` prin `resend_id`
   - `email.bounced` (hard) → insert în `suppressed_emails` (reason=`bounce`) + log
   - `email.complained` → insert în `suppressed_emails` (reason=`complaint`) + log
   - `email.delivery_delayed` / `opened` / `clicked` → log informativ
3. Adaug config în `supabase/config.toml`: `[functions.resend-webhook] verify_jwt = false`.
4. Deploy funcția și îți dau URL-ul exact de pus în Resend Dashboard → Webhooks.

Zero modificări la funcțiile existente (`process-email-queue`, `send-transactional-email`, `auth-email-hook`) — webhook-ul e complet independent.

**Apăs Approve** → adaug secret-ul → implementez.
