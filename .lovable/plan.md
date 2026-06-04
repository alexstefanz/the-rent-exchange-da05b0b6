
## Strategie

Păstrăm **întreaga infrastructură actuală** (queue pgmq, 18 template-uri React Email, audit log, suppression, unsubscribe). Schimbăm **doar provider-ul efectiv de livrare**: în loc ca `process-email-queue` să trimită prin Lovable Emails, trimite prin **Resend API** via gateway-ul connector.

Zero modificări UI. Zero rescriere template-uri. Zero refactor cod aplicație.

## Pași

### 1. Conectare Resend
- Conectez connector-ul Resend (`standard_connectors--connect resend`) → tu autorizezi în popup și introduci API key Resend.
- Secret `RESEND_API_KEY` devine disponibil automat în edge functions.

### 2. Configurare domeniu sender în Resend
**Acțiune ta** (manual în dashboard Resend, înainte de pasul 3):
- Adaugi `rentli.ro` în Resend → Domains.
- Vei primi MX, SPF, DKIM, DMARC records de adăugat la registrar.
- **ATENȚIE — conflict DNS:** subdomeniul `noreply.rentli.ro` (sau cel folosit acum de Lovable) e delegat NS către Lovable. Resend NU poate verifica același subdomeniu.
  - **Opțiunea A (recomandat):** Folosim subdomeniu nou pentru Resend, ex. `mail.rentli.ro` → `mail@rentli.ro` sau `noreply@mail.rentli.ro`. Lovable Emails rămâne intactă ca fallback.
  - **Opțiunea B:** Dezactivăm Lovable Emails, ștergi NS records de la registrar, apoi configurezi `noreply.rentli.ro` în Resend (poate dura până la 72h propagare DNS).
- Verifici domeniul în Resend (status "Verified").

### 3. Modificare `send-transactional-email`
Adaptez funcția să trimită prin Resend via gateway, păstrând:
- ✅ Aceeași semnătură (`templateName`, `recipientEmail`, `templateData`, `idempotencyKey`)
- ✅ Aceeași logică de rendering (React Email → HTML)
- ✅ Verificare `suppressed_emails` înainte de trimitere
- ✅ Logging în `email_send_log` (status `sent`/`failed` + `message_id` Resend pentru tracking)

Înlocuiesc apelul către Lovable Emails API cu:
```
POST https://connector-gateway.lovable.dev/resend/emails
Headers: Authorization: Bearer LOVABLE_API_KEY, X-Connection-Api-Key: RESEND_API_KEY
Body: { from, to, subject, html }
```

`from` devine ex. `Rentli <noreply@mail.rentli.ro>`.

### 4. Auth emails (opțional)
`auth-email-hook` trimite tot prin sistemul Lovable Emails. Două opțiuni:
- **Lasă pe Lovable** — auth emails (reset parolă, confirmare cont) continuă să meargă fără modificări. Recomandat dacă alegem Opțiunea A la DNS.
- **Mutăm și auth pe Resend** — modific `auth-email-hook` să trimită direct prin Resend în loc să enqueue pe `auth_emails`. Mai mult cod de schimbat, doar dacă insiști.

### 5. Configurare bounce/complaint webhooks în Resend (opțional)
Pentru ca suppression list să rămână sincronizată:
- În Resend dashboard → Webhooks → adăugăm URL-ul funcției `handle-email-suppression`.
- Adaptez funcția să accepte formatul webhook Resend (`email.bounced`, `email.complained`).

### 6. Test end-to-end
- Folosim pagina `AdminTestEmails` existentă pentru a trimite toate cele 18 template-uri prin Resend către un email de test.
- Verificăm în `AdminNotificationAudit` că status-ul devine `sent` + `message_id` Resend e logat.

## Detalii tehnice

**Ce NU se schimbă:**
- `supabase/functions/_shared/transactional-email-templates/*.tsx` (toate 18 template-urile)
- `process-email-queue` (queue logic)
- `email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens` (tabele)
- `AdminTestEmails`, `AdminNotificationAudit` (UI)
- Toate trigger-urile din cod care apelează `send-transactional-email`

**Ce se schimbă:**
- `supabase/functions/send-transactional-email/index.ts` — înlocuit apel API
- `supabase/functions/handle-email-suppression/index.ts` — adaptat la format webhook Resend (dacă alegem pasul 5)
- Nou secret: `RESEND_API_KEY` (gestionat de connector)
- `supabase/config.toml` — fără modificări

**Tradeoff-uri acceptate:**
- Pierdem retry-ul automat de 5x al Lovable Emails pe rețea (Resend are doar retry-uri proprii pe rate-limit). Putem implementa retry custom în queue worker dacă vrem.
- Cont Resend separat de monitorizat (dashboard, billing, quota).
- DNS de mentenant în 2 locuri (dacă alegem Opțiunea A).

## Întrebare înainte de implementare

Care opțiune DNS o preferi — **A** (subdomeniu nou, Lovable rămâne fallback) sau **B** (mutăm tot pe Resend, ștergem NS Lovable)? Și includem și auth emails pe Resend (pasul 4) sau doar tranzacționale?
