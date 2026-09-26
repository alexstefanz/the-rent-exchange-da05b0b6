# Repară autentificarea pentru office@rentli.ro

## Cauza (confirmată)
Parola e corectă: jurnalul arată că fiecare autentificare reușește, dar e urmată imediat de o deconectare. Pagina de autentificare verifică telefonul, iar contul office@rentli.ro nu are niciun telefon salvat. Pentru astfel de conturi, pagina deconectează utilizatorul și încearcă să afișeze mesajul „Contul tău nu are un număr de telefon”. Mesajul nu apare, pentru că notificările pop-up sunt dezactivate. Așa pare că butonul nu face nimic.

## Ce fac
1. **Administratorii nu mai trec prin verificarea telefonului la autentificare**, conform regulii deja stabilite că adminii nu sunt obligați.
2. **Conturile fără telefon nu mai sunt deconectate.** Intră normal și văd notificarea „Verifică-ți numărul de telefon…” de pe site. Verificarea se cere doar la publicare și plată, cum ai stabilit anterior.
3. **Conturile cu telefon salvat, dar neverificat** păstrează fereastra de cod SMS de acum.
4. **Verific** autentificarea contului office@rentli.ro în previzualizare, cu acordul tău la cererea de acces care va apărea.

## Detalii tehnice
- `src/pages/Auth.tsx`, blocul `USE_SMS_OTP` după login: verific `has_role(admin)` prin `user_roles`. Pentru admini, și pentru cazul `!prof.phone`, apelez `setGatingLogin(false)` și continui fluxul normal, fără `signOut()`.
