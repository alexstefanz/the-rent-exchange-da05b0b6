

## Plan: Rezolvare eroare trimitere emailuri de test

### Problema

Funcția `test-email-notifications` trimite emailuri prin **Resend API** (cont gratuit). Contul Resend asociat (z.alexstefan@gmail.com) nu are domeniu verificat, deci:
- Poate trimite doar de pe `onboarding@resend.dev`
- Poate trimite doar către **propria adresă** (z.alexstefan@gmail.com)
- Trimiterea către `aleczanderr20@gmail.com` este blocată

Domeniul `notify.rentli.ro` este încă **în așteptare DNS** — nu poate fi folosit momentan.

### Soluție

Schimb adresa destinatarului din `aleczanderr20@gmail.com` în `z.alexstefan@gmail.com` în funcția de test. Aceasta este singura adresă permisă de Resend pe contul gratuit fără domeniu verificat.

### Fișiere modificate
- `supabase/functions/test-email-notifications/index.ts` — schimb `TEST_EMAIL` la `z.alexstefan@gmail.com`
- Redeploy funcția

### Notă
Odată ce DNS-ul pentru `notify.rentli.ro` este verificat, vom putea migra la infrastructura Lovable de email și trimite către orice adresă.

