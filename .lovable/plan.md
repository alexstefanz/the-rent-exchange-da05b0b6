## Problema

După înregistrare + introducere cod OTP pe telefon, userul nu rămâne autentificat. Trebuie să dea refresh și să se logheze din nou — flow rupt.

**Cauza:** Contul nou creat prin `signUp()` are emailul neconfirmat (Supabase cere confirmare email). Sesiunea returnată este "soft" — funcționează temporar pentru apelul către `verify-phone-otp`, dar nu e o sesiune validă completă: după navigare / refresh, headerul vede `user = null` și apare "Autentificare".

În plus, fluxul nostru nu mai folosește confirmare prin email — verificarea reală e prin OTP pe telefon. Deci trebuie să marcăm emailul ca **confirmat** automat în momentul în care telefonul a fost verificat cu succes.

## Soluția

În două bucăți mici, doar pe fluxul de auth — fără atingeri în UI/business logic:

### 1. Edge function `verify-phone-otp` (server)
După ce telefonul e validat cu succes, în plus față de update-ul profilului:
- folosim service-role-ul deja prezent ca să apelăm `supabase.auth.admin.updateUserById(userId, { email_confirm: true })`
- ignorăm eroarea dacă emailul e deja confirmat (idempotent)
- răspunsul rămâne `{ success: true, phone }` — nicio schimbare de contract

### 2. Client `PhoneOtpDialog` + `Auth.tsx`
După ce `verify-phone-otp` returnează success:
- apelăm `supabase.auth.refreshSession()` în `PhoneOtpDialog.verify()` (înainte de `onVerified`) ca să primim un JWT proaspăt cu `email_confirmed_at` setat
- dacă refresh-ul eșuează (rar — token expirat), facem fallback la `signIn(email, password)` folosind credențialele păstrate temporar în `Auth.tsx` (le adăugăm într-un ref local doar pe durata flow-ului, nu în localStorage)
- după refresh, `onAuthStateChange` re-emite `SIGNED_IN` cu sesiunea validă → `AuthContext` actualizează `user` → headerul arată userul logat și `useEffect`-ul din `Auth.tsx` navighează la `/`

### 3. Detaliu mic
În `handleRegister` (Auth.tsx), salvăm `data.email` + `data.password` într-un `useRef` (`pendingCredsRef.current = { email, password }`) și îl pasăm către `PhoneOtpDialog` ca prop opțional `fallbackCreds`, folosit doar dacă `refreshSession` eșuează. Curățăm ref-ul după succes.

## Ce NU se schimbă

- UI-ul (dialog, butoane, copy)
- Fluxul de login normal
- Fluxul de reset parolă
- Verificarea telefonului din `AccountTab` (acolo userul e deja logat, deci pasul de `email_confirm` e no-op — sigur)

## Rezultat

User → creează cont → primește cod SMS → introduce 6 cifre → este logat instant pe homepage, fără refresh, fără re-login.
