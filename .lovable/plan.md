

## Plan: Notificări prin email pentru utilizatori

### Situația curentă

Proiectul are deja **7 Edge Functions** care trimit emailuri direct prin **Resend API** (cu cheia `RESEND_API_KEY`):
- `send-rental-notification` — notificări la cereri de închiriere noi
- `send-message-notification` — notificări la mesaje noi
- `send-cancellation-notification` — notificări la anulări
- `send-password-changed-notification` — notificări la schimbare parolă
- `send-general-notification` — welcome, review, produs publicat
- `respond-rental-request` — răspuns la cereri (accept/refuz)
- `request-account-deactivation` — email cu token de dezactivare

De asemenea, există un domeniu email configurat (`notify.rentli.ro`), dar **verificarea DNS a eșuat** — emailurile nu pot fi trimise de pe acest domeniu momentan.

Există și un sistem de cozi (`process-email-queue`) deja funcțional cu pgmq.

### Ce propun

Lovable are un sistem integrat de email care oferă:
1. **Emailuri de autentificare** (verificare email, resetare parolă, magic link) — cu template-uri personalizate branded Rentli
2. **Emailuri tranzacționale** (notificări la închirieri, mesaje, recenzii etc.) — prin cozi cu retry automat, rate-limit handling, și dead-letter queue

**Primul pas** este să rezolvăm problema DNS pentru domeniul `notify.rentli.ro`. Trebuie să verifici configurarea DNS în **Cloud → Emails** și să te asiguri că recordurile NS sunt corect setate la provider-ul tău de domeniu (rentli.ro).

### Două tipuri de emailuri de configurat

**1. Emailuri de autentificare (Auth Emails)**
- Verificare email la înregistrare
- Resetare parolă
- Magic link login
- Template-uri branded cu logo-ul și culorile Rentli

**2. Emailuri aplicație (App Emails)**  
- Migrarea funcțiilor existente (rental, message, cancellation etc.) pe noul sistem cu template-uri React Email
- Adăugare unsubscribe automat (conform GDPR)
- Retry automat și tracking (email_send_log)
- Suppression list (bounce/complaint handling)

### Pași de implementare

1. **Rezolvare DNS** — Tu verifici și corectezi recordurile NS pentru `notify.rentli.ro` la provider-ul tău de domeniu
2. **Setup infrastructură email** — pregătirea cozilor și funcțiilor de bază
3. **Auth email templates** — template-uri branded pentru verificare/resetare parolă
4. **Migrare notificări existente** — trecerea de la Resend direct la sistemul cu cozi și template-uri React Email
5. **Pagină de unsubscribe** — pagină branded în aplicație

### Ce trebuie de la tine

**Trebuie să verifici configurarea DNS** pentru domeniul `notify.rentli.ro`. Mergi în **Cloud → Emails** și verifică ce recorduri DNS trebuie adăugate/corectate la provider-ul tău de domeniu. Fără DNS verificat, emailurile nu pot fi trimise de pe domeniul tău.

Vrei să începem cu rezolvarea DNS-ului?

