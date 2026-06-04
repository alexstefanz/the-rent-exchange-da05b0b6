---
name: Branded Email System
description: 18 React Email templates queued in pgmq, sent via Resend connector gateway from noreply@rentli.ro
type: feature
---
Toate emailurile (auth + tranzacționale) sunt enqueue-uite în pgmq (`auth_emails`, `transactional_emails`) și trimise de `process-email-queue` prin **Resend** via gateway-ul Lovable (`connector-gateway.lovable.dev/resend/emails`).

- Sender: `Rentli <noreply@rentli.ro>` (domeniul `rentli.ro` trebuie verificat în Resend dashboard cu DNS records SPF/DKIM/DMARC).
- Secret: `RESEND_API_KEY` (connection key prin connector); `LOVABLE_API_KEY` pentru autentificare gateway.
- Retry/DLQ/TTL/suppression list rămân gestionate de queue worker — neschimbate față de versiunea Lovable Emails.
- `email_send_log.metadata.resend_id` stochează ID-ul Resend pentru tracking.
- 18 template-uri React Email în `_shared/transactional-email-templates/` + 6 template-uri auth în `_shared/email-templates/`.
