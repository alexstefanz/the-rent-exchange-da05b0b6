# Înregistrarea eșuează în tăcere: parolă respinsă ca „prea ușor de ghicit”

## Ce s-a întâmplat

Jurnalele de autentificare din 18 septembrie arată ~25 de încercări de înregistrare de pe două adrese IP, toate respinse cu același motiv:

„Password is known to be weak and easy to guess, please choose a different one.”

Contul nu se creează deloc. Persoana a reîncercat de zeci de zile la rând pentru că mesajul de eroare nu i-a fost clar: apare doar ca notificare temporară în colț, dispare repede și nu indică faptul că problema e chiar parola aleasă (nu e o parolă „slabă” ca lungime — respectă toate regulile afișate — ci una care apare în liste publice de parole compromise).

## Ce vom schimba

1. Mesaj clar, lângă câmpul de parolă
   - Când serverul respinge parola, textul rămâne vizibil sub câmpul „Parolă”, nu doar ca notificare care dispare.
   - Text: „Această parolă apare în liste publice de parole compromise. Alege alta, diferită de cele folosite pe alte site-uri.”
   - Câmpul de parolă se marchează vizual ca eronat și primește focus, ca utilizatorul să vadă imediat unde e problema.

2. Notificarea rămâne, dar cu același text explicit
   - Titlu: „Parola nu poate fi folosită”, descriere ca mai sus.

3. Acoperim și celelalte eșecuri „tăcute”
   - Aceeași afișare inline pentru limita de încercări (prea multe cereri) și pentru „email deja înregistrat”, astfel încât niciun refuz al serverului să nu treacă neobservat.

## Detalii tehnice

- `src/pages/Auth.tsx` — în `handleRegister`, pe lângă `toast`, se apelează `registerForm.setError("password", { message })` (respectiv `email` pentru cont existent) și `registerForm.setFocus(...)`.
- `src/data/uxCopy.ts` — se actualizează `auth.passwordTooWeak` cu textul explicit RO/EN de mai sus.
- Nu se modifică politica de securitate: verificarea parolelor compromise (HIBP) rămâne activă — este o protecție corectă a conturilor.

## Verificare

Rulăm o încercare reală de înregistrare cu o parolă compromisă cunoscută și confirmăm că mesajul apare sub câmp, apoi o încercare cu parolă unică și confirmăm că se trece la pasul de verificare prin SMS.
