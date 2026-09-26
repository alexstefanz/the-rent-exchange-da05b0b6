# Reparare înregistrare cont

## Cauza confirmată
La apăsarea butonului, serviciul de autentificare răspunde corect că adresa `aleczanderr20@gmail.com` este deja înregistrată (HTTP 422). Înainte ca mesajul să fie afișat sub câmpul Email, sistemul global de notificări produce eroarea JavaScript `require is not defined`; execuția se oprește, iar formularul pare că nu face nimic. Problema se reproduce și într-o sesiune incognito.

## Modificări
1. Elimin apelul incompatibil din sistemul de notificări și folosesc importul normal, compatibil cu aplicația din browser.
2. Fac formularul de înregistrare independent de notificările temporare: orice eroare de cont existent, parolă, limită sau rețea rămâne vizibilă direct în formular.
3. Protejez apelul de înregistrare cu gestionarea completă a erorilor, astfel încât butonul să nu rămână blocat pe încărcare dacă apare o problemă neașteptată.
4. Păstrez utilizatorul pe fila „Înregistrare” și mut focalizarea la câmpul care trebuie corectat.

## Verificare
- Reproduc în incognito cazul adresei deja înregistrate și confirm mesajul vizibil sub Email.
- Verific validările locale pentru telefon, parolă, confirmarea parolei și acceptarea termenilor.
- Verific faptul că o eroare de rețea este afișată în formular și butonul poate fi apăsat din nou.
- Verific fluxul unui cont nou până la deschiderea ferestrei pentru codul SMS, fără a păstra date temporare de test.
- Confirm că pagina nu mai produce erori JavaScript și că aplicația se construiește fără erori.
