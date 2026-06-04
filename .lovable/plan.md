# Migrare emailuri la Resend (noreply@rentli.ro)

## Context
- Lovable Emails pe `notify.rentli.ro` e în stare **drifted** + folosit niciodată cu succes (Resend API key invalid).
- Trecem complet pe Resend, cu trimitere de la **noreply@rentli.ro** (root domain).
- Păstrăm toate cele 18 template-uri React Email și pgmq queue + retries — schimbăm doar providerul de trimitere efectivă.

## Pași

### 1. Dezactivare Lovable Emails și pregătire DNS
- Apel `email_domain--toggle_project_emails(enabled: false)` ca să oprim infra Lovable de email (NS-urile rămân la registrar — le vei șterge manual mai târziu dacă vrei, dar nu sunt blocante pentru root rentli.ro).
- Îți spun explicit ce NS-uri să ștergi opțional la registrar pentru curățenie:
  - `notify.rentli.ro NS ns3.lovable.cloud`
  - `notify.rentli.ro NS ns4.lovable.cloud`

### 2. Conectare Resend
- Apel `standard_connectors--connect(connector_id: "resend")` — vei autoriza contul Resend din browser.
- Connector-ul setează automat `RESEND_API_KEY` în secrets-ul proiectului (gateway-routed).

### 3. Verificare rentli.ro în Resend (faci tu manual)
- Resend Dashboard → Domains → Add `rentli.ro`.
- Resend îți va da:
  - 1× `MX` (send.rentli.ro)
  - 1× `TXT` SPF (`v=spf1 include:amazonses.com ~all`)
  - 1× `TXT` DKIM (`resend._domainkey.rentli.ro`)
  - 1× `TXT` DMARC recomandat (`_dmarc.rentli.ro`)
- Le adaugi la registrar, apeși Verify în Resend. Nu intră în conflict cu NS-ul `notify.rentli.ro` (subdomeniu separat).

### 4. Refactor edge functions să trimită prin Resend gateway
- `supabase/functions/send-transactional-email/index.ts`:
  - Păstrăm queue-ul pgmq + retry-uri + logging `email_send_log` + render React Email + check `suppressed_emails`.
  - Înlocuim apelul către provider Lovable cu un POST către gateway-ul Resend:
    ```
    POST https://connector-gateway.lovable.dev/resend/emails
    Authorization: Bearer ${LOVABLE_API_KEY}
    X-Connection-Api-Key: ${RESEND_API_KEY}
    body: { from: "Rentli <noreply@rentli.ro>", to, subject, html }
    ```
  - Footerul de unsubscribe + token rămân, link-ul rămâne către `/dezinscriere?token=...`.
- `supabase/functions/auth-email-hook/index.ts`:
  - Aceeași schemă — render template (Welcome/Recovery/Magic Link/etc.) cu @react-email/render și trimitere prin Resend gateway, în loc de Lovable Mailer.
  - Hook-ul rămâne configurat în Supabase Auth (`hook_send_email_uri`).
- `supabase/functions/request-account-deactivation/index.ts`: deja folosește `send-transactional-email`, nu îl mai atingem.

### 5. Constante și config
- Setăm explicit `FROM_ADDRESS = "Rentli <noreply@rentli.ro>"` într-un `_shared/email-config.ts` reutilizat de cele 2 funcții.
- Eliminăm referințele la `SENDER_DOMAIN`/`FROM_DOMAIN` din Lovable Emails dacă mai există.

### 6. Validare end-to-end
- Deploy `send-transactional-email`, `auth-email-hook`.
- În `/admin/test-emails` trimit succesiv: `welcome`, `account-deactivation`, `password-changed`, `rental-request-owner`.
- Verific:
  - `email_send_log` are status `sent` cu `message_id` Resend.
  - Edge function logs nu au erori 401/422.
  - Resend Dashboard → Logs arată Delivered.
- Test auth: forgot password real către un email exterior.

### 7. Update memorie
- Actualizez `mem://integrations/branded-email-system` → provider Resend, from `noreply@rentli.ro`, no Mailgun NS.
- Actualizez `mem://security/edge-function-config` cu rolul nou al `send-transactional-email` (gateway Resend).

## Ce ai de făcut tu (manual)
1. Confirmi planul (după aprobare începem cu pașii 1–2).
2. Autorizezi conectarea Resend când îți cere din browser.
3. În Resend Dashboard adaugi domeniul `rentli.ro` și copiezi MX/SPF/DKIM/DMARC la registrar.
4. Îmi spui când DNS-urile sunt aplicate ca să rulez testele.

## Detalii tehnice (rezumat)
- Provider: gateway Resend (`https://connector-gateway.lovable.dev/resend/emails`).
- Auth: `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${RESEND_API_KEY}`.
- From: `Rentli <noreply@rentli.ro>` (toate emailurile, inclusiv auth).
- Reply-To: lipsește deliberat — răspunsurile merg pe chat-ul intern.
- Renderer: @react-email/render @0.0.17 (Deno npm specifier), neschimbat.
- Queue: pgmq + `process-email-queue` cron — neschimbat, doar callback-ul de send schimbă.
- Logging: `email_send_log` neschimbat — `message_id` va fi cel întors de Resend.
- Suppression: păstrăm `suppressed_emails` ca filtru pre-send; bounce-urile manuale Resend pot fi adăugate ulterior via webhook (out of scope acum).
