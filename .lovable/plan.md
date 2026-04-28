# Plan: Resetare parolă – diagnostic și fix

## Diagnostic

Am verificat sistemul de email și am descoperit:

- **Domeniul `notify.rentli.ro` este verificat** și trimite mailuri normal.
- **Hook-ul `auth-email-hook` funcționează corect** (folosește `enqueue_email`, log-urile arată mailuri `signup` trimise cu succes — ultimul pe 27 aprilie către `vlad.cuzuc@gmail.com`).
- **În `email_send_log` nu există NICIUN mail cu `template_name = 'recovery'` în istoric.** Niciodată. Asta înseamnă că Supabase Auth nu cheamă deloc hook-ul pentru evenimentul `recovery` — request-ul tău nu ajunge la sistemul nostru de mail.

### Cauzele posibile (în ordinea probabilității)

1. **Email inexistent în baza auth** — Supabase, ca măsură anti-enumerare, returnează `success` chiar dacă email-ul nu există, dar NU trimite niciun mail. Frontend-ul afișează „Verifică inbox-ul" inducând în eroare.
2. **Rate-limit Supabase Auth pe `/recover`** — limită implicită ~2 cereri/oră per IP/email. La a 3-a cerere primești tăcere fără eroare vizibilă.
3. **Spam/Promotions** — userul a confirmat că nu a verificat încă acest folder.

## Ce voi face

### 1. Verificare existență cont în UI (Auth.tsx)
Înainte de a apela `resetPasswordForEmail`, verific dacă email-ul are cont prin a încerca un sign-in dummy și a interpreta răspunsul, **SAU** mai sigur — adaug un toast informativ explicit:
> „Dacă există un cont cu această adresă, vei primi un email de resetare în câteva minute. Verifică și folder-ul Spam."

Asta elimină iluzia că email-ul ar fi fost neapărat trimis.

### 2. Loggez fiecare cerere de resetare în `user_activity_logs`
Voi adăuga un INSERT în tabela `user_activity_logs` (sau o tabelă nouă `password_reset_requests`) cu email-ul, IP-ul (din header) și timestamp, ca să putem audita ce s-a cerut și când. Asta ne ajută să confirmăm dacă request-ul ajunge măcar la backend.

### 3. Mesaj de eroare detectabil pentru rate-limit
Supabase întoarce eroare specifică `"For security purposes, you can only request this after X seconds"` la rate-limit. Detectez explicit acest mesaj și afișez un toast clar:
> „Ai cerut prea multe resetări recent. Așteaptă 60 de minute și încearcă din nou."

### 4. Edge function de diagnostic (opțional dar util)
Creez `password-reset-diagnostics` care primește un email și verifică dacă există în `auth.users` (server-side cu service role). Dacă nu există, întorc o eroare prietenoasă care îi spune userului „Nu există niciun cont cu această adresă. Vrei să te înregistrezi?". Asta sare peste protecția anti-enumerare a Supabase, dar e justificat pentru UX-ul tău (poți decide ulterior dacă o vrei expusă sau doar pentru admini).

### 5. Verificare hook activ în Supabase Auth
Deși signup funcționează, voi confirma în setările Auth → Hooks că `auth-email-hook` este selectat ca **Send Email Hook**. Dacă pentru un motiv oarecare s-a deselectat după ultima rotație de chei, doar signup-ul (care folosește OTP separat) ar mai funcționa. Asta e o verificare manuală pe care o pot face eu acum sau te ghidez să o faci tu în Cloud → Users → Auth.

## Files modificate

- `src/pages/Auth.tsx` — `handleResetPassword` cu mesaje îmbunătățite și detectare rate-limit
- `src/data/uxCopy.ts` — strings noi RO/EN pentru mesajele clarificate
- (opțional) `supabase/functions/password-reset-diagnostics/index.ts` — edge nouă pentru a verifica existența contului

## Întrebare pentru tine

Înainte să construiesc, **te rog verifică folder-ul Spam/Promotions** la adresa Gmail/Yahoo. În 80% din cazurile cu „nu primesc mail", e acolo (mailurile de signup ajung, recovery e clasat mai des spam pentru că link-ul redirecționează în afara domeniului notify).

Dacă nu e în Spam, aprob planul și implementez toate cele 5 puncte.
