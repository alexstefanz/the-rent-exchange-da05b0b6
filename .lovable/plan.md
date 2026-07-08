## Context

Ai raportat că introducând `+40743588802` la înregistrare nu primești SMS, dar cu `0743588802` da. Am verificat:

- Ambele formate ajung la aceeași funcție `normalizePhoneRO`, care returnează `+40743588802` în ambele cazuri.
- În log-urile edge function `send-phone-otp` există `code sent to=+40743588802` pentru ambele teste recente (ora 12:52 și 12:54).
- Tabelul `phone_otp_verifications` arată că OTP-ul din 12:54 a fost consumat (deci un SMS chiar a ajuns) — iar SMS-urile tranzacționale către același număr apar tot cu `+40...` și status `sent`.

Deci codul nostru trimite request identic în ambele cazuri. Problema, dacă există, este că **SMSalert răspunde HTTP 200 dar cu `status:false` în body** pentru unele numere, iar funcția `send-phone-otp` verifică doar `res.ok`, nu parsează body-ul, deci nu vede eșecul și îi spune UI-ului „cod trimis" chiar dacă providerul l-a respins.

## Ce voi face

### 1. `supabase/functions/send-phone-otp/index.ts` — validare completă a răspunsului provider

- După `fetch(SMS_API_URL, ...)` parsăm body-ul JSON.
- Considerăm succes doar dacă `res.ok && body.status === true`.
- Dacă providerul întoarce `status:false`, logăm `body` complet (id, error, message) și returnăm `502 { error: "sms_failed", providerDetails }`.
- Marcăm rândul tocmai inserat în `phone_otp_verifications` ca `consumed_at = now()` pentru a-l invalida (altfel blochează retrimiterea).

### 2. Log unificat în `sms_logs`

- La finalul funcției (succes sau eșec) inserăm un rând în `sms_logs` cu `template_key = 'phone_otp'`, `recipient_phone`, `status`, `provider_response`, `error_message`.
- Așa vedem imediat, alături de SMS-urile tranzacționale, exact ce a răspuns providerul pentru OTP.

### 3. UI: afișare eroare reală

- În `PhoneOtpDialog.tsx` toast-ul actual pe eșec `sendCode` este generic. Îl extind să afișeze `providerDetails.message` când vine (util pentru debugging live, dar rămâne prietenos: „SMS respins de provider: {motiv}").

### 4. Verificare live

- După deploy, testez cu Playwright: signup cu `+40743588802`, apoi cu `0743588802`, și inspectez rândurile noi din `sms_logs` + edge function logs. Îți raportez exact ce răspunde providerul pentru fiecare format.

## Ce NU schimb

- Regexurile de normalizare (funcționează corect, ambele formate devin `+40...`).
- Flow-ul de auto-login post-verificare.
- Rate limiting-ul.

## Rezultat așteptat

După fix, dacă providerul chiar respinge `+40...`, vei vedea imediat mesajul real în UI și în `sms_logs`, iar noi putem trata cazul (ex. retry fără `+`). Dacă providerul acceptă în ambele cazuri, log-urile vor confirma că problema e la carrier/telefon și nu la aplicație.
