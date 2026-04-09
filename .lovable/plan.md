

## Plan: Adăugare logo Rentli în toate template-urile de email

### Abordare

Logo-ul `rentli_logo.png` din `src/assets/` trebuie servit de la o adresă publică accesibilă din email. Vom folosi Supabase Storage (un bucket public) pentru a hosta logo-ul, apoi vom actualiza toate template-urile de email (transacționale + auth) să folosească `<Img>` din React Email în loc de textul "Rentli" din header.

### Pași

**1. Upload logo în Storage (bucket public)**
- Creare bucket public `email-assets` (dacă nu există)
- Upload `rentli_logo.png` în bucket
- Obținere URL public permanent

**2. Actualizare template-uri transacționale (12 fișiere)**

Fișiere din `supabase/functions/_shared/transactional-email-templates/`:
- `welcome.tsx`, `rental-request-owner.tsx`, `rental-request-renter.tsx`, `rental-accepted.tsx`, `rental-rejected.tsx`, `cancellation-owner.tsx`, `cancellation-renter.tsx`, `new-message.tsx`, `review-received.tsx`, `product-published.tsx`, `password-changed.tsx`, `account-deactivation.tsx`

Modificări per template:
- Import `Img` din `@react-email/components`
- Înlocuire `<Heading style={headerTitle}>{SITE_NAME}</Heading>` cu `<Img src={LOGO_URL} alt="Rentli" width="120" height="40" style={logoStyle} />`
- Header-ul portocaliu (#F59E0B) rămâne, logo-ul alb va fi vizibil pe fundal portocaliu

**3. Actualizare template-uri auth (6 fișiere)**

Fișiere din `supabase/functions/_shared/email-templates/`:
- `signup.tsx`, `recovery.tsx`, `magic-link.tsx`, `invite.tsx`, `email-change.tsx`, `reauthentication.tsx`

Adăugare logo în header (aceleași modificări).

**4. Deploy Edge Functions**

Deploy `send-transactional-email` și `auth-email-hook` pentru ca modificările să fie active.

### Detalii tehnice

- URL-ul logo-ului va fi stocat ca o constantă `LOGO_URL` în fiecare template (URL-ul public din Storage)
- Logo-ul va avea `width="120"` și `height="40"` pentru consistență cu Navbar-ul
- Se va folosi componenta `<Img>` din React Email (optimizată pentru clienți de email)
- Template-ul `welcome.tsx` nu are header portocaliu — va primi și el un header consistent cu celelalte

