# Pop-up confirmare la „Schimbă parola"

În `src/components/profile/AccountTab.tsx`, butonul cheamă deja `resetPasswordForEmail` și afișează un toast — dar toast-ul trece neobservat. Îl înlocuiesc cu un dialog vizibil.

## Modificări
- Adaug un `AlertDialog` (shadcn, deja folosit în proiect) controlat de un state nou `passwordResetSentOpen`.
- În `handlePasswordReset`, după succes, în loc de toast deschid dialogul. Conținut bilingv:
  - Titlu: „Email trimis" / „Email sent"
  - Descriere: „Ți-am trimis un email la **{user.email}** cu un link pentru resetarea parolei. Verifică inbox-ul (și folderul Spam)." / EN echivalent
  - Acțiune unică: „Am înțeles" / „Got it" care închide dialogul
- Pentru eroare păstrez toast destructive ca acum.
- Nu schimb logica de trimitere a email-ului, nu ating fluxul `/reset-password`.
