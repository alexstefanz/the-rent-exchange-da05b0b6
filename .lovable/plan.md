## Audit Contul Meu (`/contul-meu` → `AccountTab.tsx`)

Am verificat fiecare secțiune și legăturile/acțiunile către restul platformei. Majoritatea funcționalităților merg corect (salvare profil, OTP telefon, KYC inline, reset parolă, IBAN cu blocare la retrageri pending, dezactivare cont via edge function). Există însă câteva **linkuri rupte** și inconsistențe care trebuie reparate.

## Probleme identificate

### 1. Suport & siguranță — linkuri rupte și navigație incorectă
În `AccountTab.tsx` componenta `SupportLink` folosește `<a href>` (reload complet de pagină) în loc de `<Link>` din React Router. În plus, două rute nu există în `App.tsx`:

| Label actual | href actual | Problemă |
|---|---|---|
| "Centru suport" | `/suport` | Ruta `/suport` afișează `UserTickets` (Tichetele mele), nu Centrul de suport. Corect e `/centru-asistenta`. |
| "Tichetele mele" | `/tichete` | **Ruta nu există** → 404. Corect: `/suport`. |
| "Cum funcționează" | `/cum-functioneaza` | OK |
| "Termeni & condiții" | `/termeni-conditii` | **Ruta nu există** → 404. Corect: `/termeni-si-conditii`. |

### 2. Centru notificări — lipsește acces la preferințe detaliate
Toggle-urile pentru Email/Marketing sunt marcate "soon", dar există deja pagina `/setari/notificari` (`NotificationPreferences`) care permite configurări reale. Adăugăm un link „Setări avansate notificări" către acea pagină.

### 3. PayoutForm — link intern către secțiunea Profil
Linia 1042: `navigate("/contul-meu?section=profile")` — `AccountTab` nu citește `?section`, deci nu se face scroll. Secțiunea se numește `personal`, nu `profile`. Înlocuim cu `scrollToSection('personal')` (sau citim `?section` la mount).

### 4. Email contact (public) — clarificare
Câmpul „Email contact (public)" este salvat ca `profiles.email`, dar nu e expus public nicăieri (am verificat — gated contact flow nu îl folosește). Pentru a evita confuzia, schimbăm label-ul în „Email de contact (opțional)" și hint-ul: „Folosit doar intern, după activarea unei închirieri."

## Ce NU schimb (deja funcțional)
- Informații personale: formularul cu validare Zod, OTP pe schimbare telefon, upload avatar cu cropper.
- Centru de verificare: status KYC + `KycInlineFlow` + redirect către `/verificare` corect.
- Centru de securitate: reset parolă prin Supabase, ultima conectare; 2FA/sessions marcate corect ca „soon".
- Cum primești banii: IBAN cu validare regex, blocare la cereri pending, ștergere cu confirm.
- Dezactivează contul: edge function `request-account-deactivation` cu email de confirmare.

## Modificări de cod

**`src/components/profile/AccountTab.tsx`**
1. `SupportLink`: înlocuiește `<a href>` cu `<Link to>` din `react-router-dom`.
2. Lista `SupportLink`-urilor:
   - „Centru suport" → `/centru-asistenta`
   - „Tichetele mele" → `/suport`
   - „Termeni & condiții" → `/termeni-si-conditii`
3. Secțiunea Notificări: adaugă card/link „Setări avansate notificări" → `/setari/notificari`.
4. `PayoutForm`: înlocuiește `navigate("/contul-meu?section=profile")` cu `scrollToSection('personal')` (mutăm helper-ul sau îl importăm).
5. Câmp „Email contact (public)" → relabel + hint clar.

Nu sunt necesare migrații, edge functions sau modificări de business logic.