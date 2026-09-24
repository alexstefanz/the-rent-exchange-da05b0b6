# Resetare completă a platformei Rentli

## Rezultat
Platforma revine la o stare curată, fără conturi, anunțuri sau activitate operațională. Structura aplicației și taxonomia rămân funcționale.

Situația verificată înainte de resetare include:
- 61 conturi și 61 profiluri
- 75 anunțuri
- 224 închirieri și 298 tranzacții
- 164 conversații și 520 mesaje
- 2.316 notificări și 3.177 înregistrări de audit al notificărilor
- 63 tichete operaționale și 979 intrări în jurnalul de activitate
- 817 SMS-uri în jurnal
- aproximativ 795 MB de fișiere încărcate

## Etapa 1 — Copie de siguranță obligatorie
Înainte de orice ștergere:
1. Se generează exportul complet al bazei de date din **Cloud → Advanced settings → Export data**.
2. Se descarcă separat o arhivă a fișierelor utilizatorilor din spațiul de stocare.
3. Se verifică faptul că exportul bazei de date și arhiva fișierelor există și pot fi deschise.

Resetarea nu începe dacă una dintre copii nu a fost obținută. Exportul bazei de date este pentru recuperare de urgență; parolele nu sunt exportate în clar.

## Etapa 2 — Ștergerea datelor operaționale
Se golesc, într-o operațiune controlată și în ordinea corectă a dependențelor:
- rezervări, confirmări, anulări, predări/returnări, procese-verbale și fotografiile asociate;
- tranzacții, solduri, retrageri, metode de plată salvate și înregistrări financiare;
- conversații, mesaje, atașamente, raportări și blocări între utilizatori;
- tichete, răspunsuri, atașamente, evaluări suport și auditul tichetelor;
- notificări pentru utilizatori și administratori, preferințe, audit și cozi de email;
- SMS-uri, coduri de verificare și tokenuri temporare;
- recenzii, favorite, drafturi și vizualizări ale produselor;
- jurnalul de activitate și toate datele din analytics bazate pe activitatea existentă;
- listele de protecție, dezabonările, emailurile suprimate și cache-urile operaționale;
- rolurile, specializările și toate profilurile.

Tabelele și regulile aplicației nu sunt eliminate; sunt golite doar datele, astfel încât funcțiile site-ului să poată fi folosite din nou imediat.

## Etapa 3 — Fișiere și conturi
1. Se șterg prin serviciul de fișiere toate obiectele din:
   - imagini de anunțuri;
   - avatare;
   - fișiere din conversații;
   - fotografii de inspecție;
   - PDF-uri și fotografii de predare/returnare;
   - atașamente de suport și tichete.
2. Se păstrează doar resursele tehnice ale platformei, precum sigla folosită în emailuri.
3. După golirea datelor dependente, se șterg toate cele 61 de conturi din sistemul de autentificare, inclusiv sesiunile și identitățile asociate.

## Date păstrate
- cele 12 categorii și 68 de subcategorii;
- coordonatele localităților folosite de hartă;
- articolele Centrului de ajutor și răspunsurile standard de suport;
- configurațiile tehnice pentru email, SMS, plăți, hărți și autentificare;
- structura bazei de date, regulile de acces, automatizările și funcțiile;
- sigla și celelalte resurse tehnice ale platformei.

## Verificare finală
După resetare se confirmă că:
- numărul de conturi, profiluri, anunțuri, închirieri, conversații, tichete, tranzacții și jurnale este zero;
- directoarele de fișiere ale utilizatorilor sunt goale;
- categoriile, subcategoriile și coordonatele hărții sunt intacte;
- pagina publică se încarcă și arată catalogul gol fără erori;
- se poate crea un cont nou, iar acesta pornește fără sold, notificări sau istoric;
- nu mai există acces administrativ până când unui cont nou nu i se atribuie explicit rolul de administrator.

## Siguranță și limitări
- Operațiunea este definitivă în sistemul activ și afectează simultan site-ul public și previzualizarea.
- Restaurarea, dacă va fi necesară, se face din exportul creat înaintea resetării și nu este inclusă în această operațiune.
- Deoarece ai ales să nu păstrezi niciun cont, după resetare trebuie creat un cont nou înainte de a putea reactiva accesul în Panoul Admin.
