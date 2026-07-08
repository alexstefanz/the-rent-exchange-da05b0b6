
# Auto-login după crearea contului

## Problemă
După ce un utilizator nou completează înregistrarea și verifică codul SMS, în unele cazuri sesiunea nu este activă și utilizatorul este trimis la pagina de login. Motivul: la `signUp` Supabase nu emite mereu o sesiune (când emailul nu e confirmat), iar `refreshSession()` din `PhoneOtpDialog` eșuează silențios; fallback-ul `signInWithPassword` rulează doar la eroare explicită.

## Soluție
După verificarea reușită a OTP-ului telefonic (moment în care edge function-ul `verify-phone-otp` marchează deja emailul ca fiind confirmat), forțăm o autentificare completă cu credențialele salvate în timpul înregistrării, astfel încât utilizatorul să aibă garantat o sesiune activă și să fie dus direct la homepage — fără să mai treacă prin ecranul de login.

## Modificări

**`src/components/profile/PhoneOtpDialog.tsx`**
- În funcția `verify()`, după `toast.success`, dacă sunt disponibile `fallbackCreds` (cazul înregistrării), să apeleze întotdeauna `supabase.auth.signInWithPassword({ email, password })` — nu doar când `refreshSession()` eșuează. Emailul este deja confirmat de edge function, deci login-ul reușește.
- Dacă nu sunt `fallbackCreds` (cazul verificării din setări de cont), păstrează comportamentul curent (doar `refreshSession`).

**`src/pages/Auth.tsx`**
- Asigură-te că `PhoneOtpDialog` primește `fallbackCreds={pendingCredsRef.current}` (verificare rapidă, dacă nu e deja pasat).
- `handlePhoneVerified` rămâne neschimbat: golește credențialele, afișează toast-ul „Bun venit" și navighează la `/`.

## Rezultat
Fluxul complet devine: completare formular → cod SMS → verificare → utilizator autentificat automat → redirect la homepage. Nu mai apare niciun ecran de login intermediar.
