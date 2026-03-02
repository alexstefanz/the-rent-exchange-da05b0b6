

## Plan: Verificare cont prin cod OTP pe email la înregistrare

### Ce construim
Înlocuim fluxul clasic de confirmare cont (click pe link din email) cu un flux OTP: după înregistrare, utilizatorul introduce un cod de 6 cifre primit pe email direct în aplicație.

### Implementare

#### 1. Modifică `AuthContext.tsx` — metoda `signUp`
- Schimbă `signUp` să folosească `supabase.auth.signUp()` fără `emailRedirectTo` (nu mai avem nevoie de redirect link)
- După signup reușit, returnează și indicația că trebuie verificare OTP

#### 2. Modifică `Auth.tsx` — adaugă stare OTP
- După înregistrare cu succes, în loc să navigheze la `/`, arată un ecran de verificare OTP
- Noi state-uri: `showOtpVerification`, `otpEmail`
- Ecranul OTP conține:
  - Mesaj "Am trimis un cod de verificare pe {email}"
  - Componenta `InputOTP` (deja instalată — `input-otp`) cu 6 sloturi
  - Buton "Verifică" care apelează `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
  - Buton "Retrimite codul" care apelează `supabase.auth.resend({ type: 'signup', email })`
- La verificare reușită: toast de succes + navigare la `/`

#### 3. Activează auto-confirm OFF (implicit)
- Verificăm că auto-confirm este dezactivat (utilizatorul trebuie să confirme emailul)
- Supabase trimite automat email-ul cu codul OTP când se folosește signup flow

#### 4. Actualizează `LoginDialog.tsx` (checkout)
- Același pattern: după signup, arată input OTP inline în dialog
- Verificare OTP + apoi apelează `onLoginSuccess`

### Detalii tehnice
- Folosim `InputOTP`, `InputOTPGroup`, `InputOTPSlot` din `src/components/ui/input-otp.tsx` (deja există)
- API Supabase: `verifyOtp({ email, token, type: 'signup' })` și `resend({ type: 'signup', email })`
- Nu necesită modificări de bază de date
- Nu necesită edge functions noi — Supabase trimite automat emailul cu OTP

### Fișiere modificate
- `src/contexts/AuthContext.tsx` — actualizare `signUp`
- `src/pages/Auth.tsx` — adaugă ecran OTP post-înregistrare
- `src/components/checkout/LoginDialog.tsx` — adaugă OTP inline post-signup

