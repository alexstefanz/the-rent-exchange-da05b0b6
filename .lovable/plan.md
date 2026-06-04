## Obiectiv
Switch temporar sender de la `noreply@rentli.ro` la `onboarding@resend.dev` pentru a confirma că restul pipeline-ului funcționează, până se verifică domeniul `rentli.ro` în Resend.

## Modificări

**1. `supabase/functions/send-transactional-email/index.ts`**
- Schimb `FROM_DOMAIN = "rentli.ro"` → `FROM_DOMAIN = "resend.dev"`
- Schimb sender-ul construit: `${SITE_NAME} <noreply@${FROM_DOMAIN}>` → `${SITE_NAME} <onboarding@resend.dev>` (Resend acceptă doar `onboarding@resend.dev` exact, nu `noreply@resend.dev`)

**2. Verific dacă mai există alți senders hardcodați** în:
- `supabase/functions/auth-email-hook/` (dacă există)
- `supabase/functions/process-email-queue/` 
- alte funcții care construiesc `from:`

Le aliniez toate la `Rentli <onboarding@resend.dev>` temporar.

**3. `src/pages/admin/AdminTestEmails.tsx`**
- Update text UI: "via **noreply@rentli.ro**" → "via **onboarding@resend.dev** (test mode)" + mic banner avertisment galben că e mod temporar până la verificare DNS.

**4. Deploy edge functions** modificate.

## După verificare DNS (pași viitori, nu acum)
Revert simplu: `FROM_DOMAIN` înapoi la `rentli.ro`, sender înapoi la `noreply@rentli.ro`, scoate banner-ul din AdminTestEmails.

## Restricții cunoscute Resend test mode
- `onboarding@resend.dev` poate trimite **doar către adresa email-ului contului Resend** (proprietarul contului). Deci testele vor merge doar către `z.alexstefan@gmail.com` dacă acela e contul Resend. Către alte adrese va da `403 you can only send testing emails to your own email address`.
- Pipeline-ul (queue → log → status `sent`) se va putea confirma complet.
