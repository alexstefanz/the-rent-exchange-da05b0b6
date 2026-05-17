## Verificare nr de telefon prin SMS OTP

Adăugăm un pas de confirmare prin SMS cu cod de 6 cifre atunci când utilizatorul introduce prima oară un număr de telefon sau îl schimbă din pagina de cont.

### Flow utilizator

1. În "Contul meu" → tab "Profil", la salvare, dacă `phone` s-a schimbat față de cel existent în profil:
   - În loc să salvăm direct, deschidem un dialog "Verifică numărul de telefon".
   - Trimitem automat un SMS cu un cod de 6 cifre la noul număr.
2. În dialog: 6 căsuțe OTP, buton "Verifică", link "Retrimite codul" (cooldown 60s).
3. La cod corect → salvăm `phone` în `profiles` + `auth.user_metadata.phone`, închidem dialogul, toast de succes, banner-ul `PhoneRequiredGate` devine verde.
4. La cod greșit → mesaj inline, max 5 încercări per cod, apoi cere retrimitere.
5. Codul expiră în 10 minute. Anulare dialog → numărul nu se salvează.
6. Restul câmpurilor (nume, email, whatsapp) se salvează imediat la submit, indiferent de telefon — doar telefonul e gated de OTP.

### Componente noi

- `src/components/profile/PhoneOtpDialog.tsx` — dialog cu `InputOTP` (6 sloturi), countdown pentru resend, mesaje RO/EN prin `useUxCopy`/`useLanguage`.

### Edge functions noi

- `supabase/functions/send-phone-otp/index.ts`
  - Input: `{ phone: string }` (validat cu `isValidRomanianPhone` echivalent server-side).
  - Auth: necesită JWT (citește `user.id`).
  - Rate limit: max 3 trimiteri / 10 min per user, min 60s între trimiteri.
  - Generează cod random 6 cifre, hash bcrypt, salvează în tabel `phone_otp_verifications`.
  - Trimite SMS via `smsalert.mobi` (același provider ca `send-sms-notification`) cu text: `Rentli: codul tau de verificare este XXXXXX. Expira in 10 min.`
- `supabase/functions/verify-phone-otp/index.ts`
  - Input: `{ phone: string, code: string }`.
  - Verifică hash + expirare + attempts, incrementează attempts.
  - La succes: `UPDATE profiles SET phone = $1 WHERE id = auth.uid()`, marchează OTP `consumed_at`, returnează `{ ok: true }`.

### Schimbări DB (migrare)

Tabel nou `public.phone_otp_verifications`:
- `user_id uuid` (FK logic la profiles), `phone text`, `code_hash text`, `attempts int default 0`, `expires_at timestamptz`, `consumed_at timestamptz null`, `created_at`.
- Index pe `(user_id, created_at desc)`.
- RLS: deny-by-default — doar edge functions cu service role scriu/citesc. Niciun policy pentru utilizatori.

### Schimbări în cod existent

- `src/components/profile/AccountTab.tsx`
  - În `handleSubmit`: dacă `normalizedPhone` diferă de `profile?.phone` și e valid → salvăm restul câmpurilor fără phone, apoi deschidem `PhoneOtpDialog` cu noul număr.
  - Dacă e gol sau identic → comportament actual.
  - La succes OTP: refetch profile + invalidate `currentUserProfile`.
- `src/data/uxCopy.ts` — adăugăm chei noi pentru titlul dialogului, hint OTP, "Cod trimis", "Cod expirat", "Cod incorect", "Retrimite în Xs", "Verifică".

### Detalii tehnice

- OTP: 6 cifre numerice (`InputOTP maxLength={6}`), distinct de OTP-ul de 8 cifre folosit la signup.
- Hash: `bcrypt` import din `https://deno.land/x/bcrypt` în edge function.
- Rate limiting: query pe `phone_otp_verifications` pe ultimele 10 min.
- Telefon validat cu `isValidRomanianPhone` în frontend; în edge function re-validăm cu un regex echivalent.
- Provider SMS: reutilizăm `SMSALERT_*` secrets deja configurate pentru `send-sms-notification`.
- Niciun impact pe signup-ul Supabase (rămâne email + 8-digit OTP). Acesta e un OTP separat, doar pentru câmpul `phone` din profil.

### Ce NU se schimbă

- Login / signup flow.
- Banner-ul `PhoneRequiredGate` și logica `usePhoneRequired` — doar primesc un telefon care acum e garantat verificat.
- Restul tab-urilor din contul utilizatorului.
