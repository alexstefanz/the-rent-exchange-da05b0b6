# Verificare și reparare emailuri Rentli

## Rezultat urmărit
Toate emailurile, inclusiv resetarea parolei, vor folosi același layout Rentli în limba română: logo, culori portocalii, texte corecte și linkuri funcționale.

## Situația verificată
- Captura primită este emailul implicit, în engleză, nu șablonul Rentli existent în proiect.
- Șablonul Rentli pentru resetarea parolei există deja și folosește layoutul comun cu logo, culori de brand, footer și text românesc.
- Toate cele șase șabloane de autentificare folosesc același layout comun: înregistrare, invitație, link de autentificare, resetare parolă, schimbare email și reverificare.
- Cererea recentă nu apare în jurnalul fluxului personalizat, iar funcția care ar trebui să o proceseze nu are execuții recente. Prin urmare, serviciul de autentificare a folosit emailul implicit.
- Configurarea domeniului `notify.rentli.ro` este expirată după eșecul verificării DNS; aceasta blochează activarea completă a trimiterii personalizate.
- Codul păstrează încă expeditorul temporar `onboarding@resend.dev`, care nu trebuie să rămână în fluxul final Rentli.

## Pași de implementare
1. **Păstrarea și verificarea șabloanelor Rentli**
   - Verific toate cele șase emailuri de autentificare pentru texte, diacritice, subiecte, butoane și linkuri.
   - Verific layoutul comun pe desktop și mobil și confirm încărcarea logo-ului.

2. **Reactivarea fluxului personalizat de autentificare**
   - Actualizez integrarea emailurilor de autentificare fără a suprascrie designul Rentli.
   - Public funcția responsabilă de emailurile de autentificare și verific că evenimentul de resetare ajunge la ea.

3. **Corectarea expeditorului**
   - Elimin expeditorul temporar `onboarding@resend.dev` din fluxul final.
   - Folosesc adresa Rentli aferentă domeniului verificat, după ce configurarea domeniului este activă.

4. **Finalizarea domeniului de email**
   - Repornez configurarea existentă pentru `notify.rentli.ro` după confirmarea înregistrărilor DNS afișate în setările Email.
   - Dacă înregistrările sunt deja corecte și verificarea eșuează din nou, problema trebuie escaladată către suportul Lovable, deoarece configurarea a expirat în platformă.

5. **Testare completă**
   - Generez previzualizări pentru emailurile de autentificare.
   - Trimit un test de resetare și verific: subiect românesc, layout Rentli, expeditor, link de resetare și înregistrarea livrării.
   - Verific prin sondaj și emailurile aplicației pentru a confirma că folosesc același design și nu au layout implicit.

## Limită externă
Activarea expeditorului Rentli depinde de verificarea DNS pentru domeniul de email. Modificările și testele locale pot fi pregătite, dar trimiterea finală cu identitatea Rentli nu poate fi confirmată până când domeniul devine activ.
