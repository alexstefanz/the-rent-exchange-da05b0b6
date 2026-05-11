Am verificat configurația de email și logurile de livrare:

- `notify.rentli.ro` este verificat și activ pentru trimitere.
- Emailurile recente de auth apar ca `sent`, inclusiv către Gmail.
- Adresele testate (`dskayer23@gmail.com`, `denis.matrescu10@gmail.com`) există deja ca profiluri Rentli.
- Când încerci să faci signup cu un email deja existent, sistemul raportează intern `user_repeated_signup` și nu generează un cod nou de verificare pentru contul deja creat.

Plan propus:

1. Clarific mesajele din UI la înregistrare
   - Dacă utilizatorul folosește un email deja existent, afișăm mesaj clar: „Există deja un cont cu acest email. Autentifică-te sau folosește recuperarea parolei.”
   - Eliminăm impresia că ar trebui să primească un cod nou pentru un cont deja existent.

2. Îmbunătățesc fluxul de resend/confirmare
   - Butonul de retrimitere va fi afișat doar când are sens pentru conturi neconfirmate.
   - Pentru conturile existente confirmate, direcționăm utilizatorul către login/parolă uitată.

3. Verific textele din pagina de autentificare
   - Mă asigur că limbajul spune corect dacă se trimite link/cod de confirmare sau dacă emailul este deja folosit.
   - Păstrez stilul Rentli și UX-ul mobile-first.

Rezultat așteptat:
- Livrarea emailurilor rămâne funcțională.
- Utilizatorii nu mai cred că Gmail „nu primește codul” atunci când de fapt testează cu un email deja înregistrat.
- Signup-ul devine mai clar și mai ușor de depanat pentru utilizatori reali.