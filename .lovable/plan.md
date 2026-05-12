## Problema

Erorile „Prea multe încercări" la signup și reset parolă (vezi screenshots) provin de la limita SMTP internă a Lovable Cloud / Supabase:

```
error_code: over_email_send_rate_limit
status: 429
path: /signup și /recover
```

Limita serverului SMTP intern al Supabase este de **~2-4 emailuri / oră / proiect** (partajată între toți userii). Pe Rentli, cu volumul actual de signup-uri și reseturi, aceasta este atinsă constant.

În plus, Supabase aplică:
- ~1 reset / 60 sec per email pe `/recover`
- Blocare la signup repetat al aceluiași email

## Soluția

Mutăm trimiterea emailurilor de auth de pe SMTP-ul intern Supabase pe **Resend**, prin domeniul deja verificat `rentli.ro`. Proiectul folosește deja Resend pentru emailurile tranzacționale (`send-transactional-email`, `send-password-changed-notification` etc.), deci infrastructura există.

Concret, vom configura un **auth email hook** — o edge function (`auth-email-hook`) pe care Supabase o apelează în loc să trimită singur emailul. Funcția randează template-ul brandat și îl trimite prin Resend.

## Pași de implementare

1. **Scaffold template-uri auth email** — generează:
   - `supabase/functions/auth-email-hook/index.ts` (hook-ul Supabase)
   - `supabase/functions/_shared/email-templates/*.tsx` (6 template-uri React Email: signup, magic-link, recovery, invite, email-change, reauthentication)

2. **Brand template-urile** — culorile Rentli (#F59E0B, #FCFAF8), font Plus Jakarta Sans, body alb, layout consistent cu emailurile tranzacționale existente.

3. **Deploy `auth-email-hook`** — devine activ automat după verificare DNS (deja făcută pentru `rentli.ro`).

4. **Verificare** — test signup + reset parolă din UI; verificare că emailurile vin de la `noreply@rentli.ro` și nu mai apare 429 în logs.

## Ce NU se schimbă

- UI-ul (LoginDialog, Auth.tsx, mesajele de eroare existente)
- Logica de signup/signIn din `AuthContext.tsx`
- Emailurile tranzacționale existente (rentals, notifications, etc.) — funcționează deja perfect prin Resend
- Rate-limit-ul per-cont (1 reset/60s) rămâne — e o protecție anti-abuz utilă

## Limite noi (după implementare)

- Resend free: 100 emailuri/zi, 3000/lună
- Resend pro ($20/lună): 50.000/lună, 10/sec — recomandat pentru producție Rentli

## Observație despre erori UI

Mesajul al treilea („Eroare — Nu s-a putut trimite cererea") este probabil o eroare generică pentru același 429. După fix va dispărea natural; dacă vrei, ulterior pot îmbunătăți mesajul să spună explicit „Așteaptă X minute" în loc de generic.
