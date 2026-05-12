# Fix: "email rate limit exceeded" la înregistrare

## Diagnostic

Eroarea **`429 over_email_send_rate_limit`** vine direct din serviciul implicit de email al Supabase Auth (limitat la ~3-4 emailuri/oră pentru întregul proiect — folosit doar pentru dev).

Verificări efectuate:
- ✅ Domeniul `rentli.ro` este **verificat și activ** în Lovable Emails
- ✅ Funcția `auth-email-hook` există în cod (`supabase/functions/auth-email-hook/index.ts`)
- ❌ **Funcția `auth-email-hook` nu are niciun log** → Supabase Auth nu o apelează deloc
- ❌ Hook-ul nu este activat la nivel de proiect, deci Supabase folosește serviciul default (rate-limited)

Practic, deși ai templates branded, Supabase Auth nu le folosește pentru că hook-ul nu este înregistrat/activ. La fiecare signup folosește pipeline-ul lui implicit, care s-a saturat azi.

## Plan de remediere

1. **Re-deploy `auth-email-hook`** — forțează re-înregistrarea la Supabase Auth ca să fie activat ca handler oficial de emailuri auth (signup confirmation, password reset, magic link, email change).

2. **Verificare după deploy:**
   - Trimit un signup de test cu un email nou
   - Verific în logs că `auth-email-hook` primește invocații (200 OK)
   - Verific că emailul ajunge prin `noreply@rentli.ro` (nu prin Supabase default)
   - Confirm că rate limit-ul dispare (Lovable Emails nu are limita asta)

3. **Status follow-up automat** — Cloud → Emails reconciliază starea după deploy. Dacă activarea rămâne blocată după ~1 minut, raportez și tratez (ex: `setup_email_infra` pentru re-provision dacă lipsește vreo migrare).

## Out of scope

- Nu modificăm templates de email (sunt deja branded)
- Nu schimbăm domeniul `rentli.ro` 
- Nu atingem fluxul de checkout / Stripe Test Mode (separat)
- Nu adăugăm rate limiting custom (politica internă)

## Notă pentru cont blocat

Contul `oana.ciuhureanu@primaconstruct.ro` a rămas în `auth.users` ca **neconfirmat** (signup-ul a creat user-ul dar emailul nu a plecat). După fix, cel mai simplu este să-l ștergi din admin (sau îl șterg eu) și Oana să încerce din nou — sau pot retrimite manual emailul de confirmare.
