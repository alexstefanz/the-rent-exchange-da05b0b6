
## Obiectiv

Pe perioada cât domeniul `notify.rentli.ro` nu este propagat și emailurile de confirmare nu pleacă, mutăm verificarea contului la înregistrare de pe **email OTP** pe **SMS OTP** (cod de 6 cifre pe telefon). Userul nu se poate loga până nu confirmă numărul de telefon.

Infrastructura SMS există deja (`send-phone-otp` + `verify-phone-otp` cu SMSAlert), o refolosim.

## Flux nou la înregistrare

```text
1. User completează: email + parolă + telefon (+40...) + acceptă termenii
2. signUp() creează contul în Supabase (auto-confirm email = ON)
   → contul devine activ tehnic, dar marcăm profilul ca phone_verified = false
3. UI trece automat în ecranul „Verifică telefonul"
   → trimite SMS cu cod 6 cifre prin send-phone-otp
4. User introduce codul → verify-phone-otp setează profiles.phone + phone_verified = true
5. Welcome → /onboarding/business (business) sau / (individual)
```

La **login**:
- Dacă userul are `phone_verified = false` (cont nou nefinalizat), îl deconectăm și îl punem să verifice telefonul înainte să intre în aplicație.
- Conturile existente (create înainte de schimbare) nu sunt afectate — pentru ele tratăm `phone_verified` ca implicit `true` (backfill în migrație).

## Modificări necesare

### 1. Migrație DB
- `profiles.phone_verified boolean NOT NULL DEFAULT false`
- Backfill: `UPDATE profiles SET phone_verified = true` pentru toate rândurile existente (deja active, nu vrem să-i blocăm).
- Index pe `phone_verified` (opțional, light).

### 2. Auth Supabase
- `configure_auth` cu `auto_confirm_email = true` (temporar — emailurile nu pleacă, deci nu putem cere confirmare prin email).

### 3. Edge function `send-phone-otp`
- Momentan necesită JWT (verifică `auth.getUser(token)`). Adăugăm un mod „pre-login" în care, dacă nu există JWT, acceptă `{ phone, userId }` semnat cu un token returnat de `signUp`.
- Soluție simplă & sigură: după `signUp` clientul are deja sesiune validă (Supabase loghează automat când auto-confirm e ON) → JWT-ul este disponibil, deci NU e nevoie să schimbăm funcția. ✅
- La fel pentru `verify-phone-otp` — folosește JWT-ul sesiunii curente. Pe lângă `phone`, va seta și `phone_verified = true`.

### 4. `src/pages/Auth.tsx`
- Schema `registerSchema`: adăugăm `phone` (regex RO `+40XXXXXXXXX` / `07XXXXXXXX`, validare prin `normalizePhoneRO`).
- Input nou „Număr de telefon" în formul de înregistrare (cu hint „Vei primi un SMS cu codul de verificare").
- După `signUp()` cu succes → în loc de ecranul OTP email, deschidem `<PhoneOtpDialog>` (există deja) sau un ecran similar în pagină.
- La verificare reușită: continuăm fluxul existent (welcome email best-effort, redirect business/individual).
- Ștergem / ascundem ecranul OTP email (`showOtpVerification` cu `verifyOtp({type:"signup"})`) — îl punem după un flag `USE_SMS_OTP = true` ca să fie ușor de revenit când propagă domeniul.

### 5. Login (`handleLogin` / `AuthContext`)
- După `signIn` cu succes, citim `profiles.phone_verified`. Dacă e `false`:
  - Nu navigăm la `/`.
  - Afișăm `<PhoneOtpDialog>` cu telefonul deja salvat (sau cerem unul dacă lipsește).
  - Doar după verificare reușită → redirect la `/`.

### 6. UX copy (RO/EN) în `src/data/uxCopy.ts`
- Etichete: „Număr de telefon", „Trimitem un SMS cu codul de verificare", „Verifică telefonul pentru a continua".

## Detalii tehnice

- Telefonul este normalizat la `+40XXXXXXXXX` (helper deja există în edge functions; replicăm validarea în client cu zod regex).
- SMSAlert e deja configurat (`SMS_ALERT_USERNAME`, `SMS_ALERT_API_KEY`).
- Rate-limit existent în `send-phone-otp`: 60s între SMS-uri, max 3 / 10 min / user — OK.
- Welcome email rămâne în coadă; va pleca când domeniul propagă (nu blocăm fluxul dacă eșuează).
- Flag `USE_SMS_OTP` într-un singur loc (constantă în `Auth.tsx`) ca să dăm revert ușor la email OTP.

## Plan de revenire (după ce notify.rentli.ro e activ)
1. Setăm `USE_SMS_OTP = false`.
2. `configure_auth` cu `auto_confirm_email = false`.
3. Coloana `phone_verified` rămâne (utilă pentru gating ulterior, nu o ștergem).
