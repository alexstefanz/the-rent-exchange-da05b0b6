

## Plan: Configurare sistem de email Lovable pentru Rentli

### Situația actuală

Proiectul are deja **9 Edge Functions** care trimit emailuri prin Resend API direct:
- `send-rental-notification` — notificare cerere nouă de închiriere
- `respond-rental-request` — răspuns la cerere (acceptare/refuzare)
- `send-cancellation-notification` — anulare rezervare
- `send-message-notification` — mesaj nou în conversație
- `send-general-notification` — notificări generale
- `send-password-changed-notification` — schimbare parolă
- `request-account-deactivation` — cerere dezactivare cont
- `auth-email-hook` — emailuri de autentificare (2FA, confirmare, resetare parolă)
- `send-transactional-email` — sistem transacțional cu template-uri React Email

Template-ul de email folosit este cel cu branding Rentli (header portocaliu #F59E0B, font Plus Jakarta Sans, background #FAF9F7).

### Ce trebuie configurat

**Important:** Lovable Cloud are un sistem integrat de email cu cozi de retry, suport unsubscribe, tracking și deliverability — nu ai nevoie de Cloudflare pentru email. Cloudflare e excelent pentru DNS/CDN, dar pentru emailuri Lovable folosește propria infrastructură care funcționează nativ.

### Pași de implementare

**Pasul 1: Configurare domeniu de email**
- Trebuie configurat domeniul `rentli.ro` prin dialogul de setup din Lovable
- Se va crea un subdomeniu `notify.rentli.ro` delegat la nameserverele Lovable
- Vei primi DNS records (NS records) pe care trebuie să le adaugi în Cloudflare (unde gestionezi DNS-ul pentru rentli.ro)
- Verificarea DNS durează până la 72h

**Pasul 2: Setup infrastructură email**
- Creare cozi pgmq pentru retry automat (auth_emails + transactional_emails)
- Tabele: `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`
- Cron job `process-email-queue` care procesează coada la fiecare 5 secunde
- Retry automat, dead-letter queue, rate limiting

**Pasul 3: Migrare emailuri existente de la Resend la sistemul Lovable**
- Migrare cele 6 Edge Functions de notificări (rental, cancellation, message, general, password, deactivation) la template-uri React Email în registry
- Fiecare funcție va folosi `send-transactional-email` în loc de apeluri directe Resend
- Template-uri noi necesare:
  1. `rental-request` — cerere nouă de închiriere (pentru owner)
  2. `rental-accepted` — cerere acceptată (pentru renter)
  3. `rental-rejected` — cerere refuzată (pentru renter)
  4. `rental-cancelled-owner` — anulare (notificare owner)
  5. `rental-cancelled-renter` — confirmare anulare (pentru renter)
  6. `new-message` — mesaj nou în conversație
  7. `password-changed` — confirmare schimbare parolă
  8. `account-deactivation` — cerere dezactivare cont
  9. `payment-confirmation` — confirmare plată Stripe

**Pasul 4: Actualizare trigger-uri din frontend/backend**
- Înlocuire apeluri directe `fetch("https://api.resend.com/emails")` cu `supabase.functions.invoke('send-transactional-email')`
- Păstrare logica existentă de rate limiting și validare
- Adăugare `idempotencyKey` pentru fiecare email

**Pasul 5: Cleanup**
- Ștergere Edge Functions individuale devenite inutile (send-rental-notification, send-cancellation-notification, etc.)
- Eliminare referințe RESEND_API_KEY din cod

### Ce se obține
- Email deliverability mai bună (SPF/DKIM/DMARC configurate automat)
- Retry automat pentru emailuri eșuate
- Tracking și logging complet în `email_send_log`
- Suport unsubscribe GDPR-compliant
- Toate emailurile trec printr-un singur punct (`send-transactional-email`)
- Template-uri React Email ușor de modificat
- Auth emails (2FA, confirmare signup, resetare parolă) prin `auth-email-hook` deja existent

### Acțiune necesară de la tine
Primul pas este să configurezi domeniul de email. Apasă butonul de mai jos pentru a începe:

<lov-actions>
<lov-open-email-setup>Configurează domeniu email</lov-open-email-setup>
</lov-actions>

După ce adaugi NS records în Cloudflare DNS pentru `notify.rentli.ro`, voi implementa toți pașii automat.

