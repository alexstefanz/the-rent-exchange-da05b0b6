# Google propriu pentru login (logo Rentli) + verificare hărți

## Situația verificată
- Cele două valori pe care le-ai trimis sunt deja salvate în seif-ul de secrete al proiectului: `GOOGLE_OAUTH_CLIENT_ID` și `GOOGLE_OAUTH_CLIENT_SECRET`.
- Important: aceste secrete sunt folosite doar de codul de pe server. Ecranul de login cu Google NU le citește de acolo. Ca să dispară logo-ul Lovable și să apară Rentli, aceleași două valori trebuie introduse în setările de autentificare ale backend-ului, la secțiunea Google. Acest pas nu poate fi făcut de mine din cod — se face dintr-un singur ecran, în câteva secunde.
- Cheile pentru hărți sunt complet separate (`GOOGLE_MAPS_*`, gestionate prin Connectors). Schimbarea login-ului nu le afectează, dar le verificăm oricum după.

## Pași

1. **Tu**: în Backend → Authentication → Sign In Methods → Google, activezi „folosesc propriile credențiale” și lipești Client ID + Client Secret. Tot acolo copiezi adresa de callback afișată.
2. **Tu**, în Google Cloud → Credentials → clientul OAuth: adaugi acea adresă de callback la „Authorized redirect URIs”, iar la „Authorized JavaScript origins” pui `https://rentli.ro` și `https://www.rentli.ro`.
3. **Tu**, în Google Cloud → OAuth consent screen: nume aplicație „Rentli”, logo Rentli, domenii `rentli.ro` și `www.rentli.ro`, link către politica de confidențialitate și termeni.
4. **Eu**: după ce confirmi, testez logarea cu Google în fereastră privată și verific că ecranul Google afișează „Rentli”, nu Lovable.
5. **Eu**: verific încărcarea hărților pe pagina de categorie și pe pagina de produs (hartă, pini, zonă de proximitate) și raportez dacă apare vreo eroare.

## Aplicația mobilă
Nu trebuie să refaci demersul în Google Cloud pentru mobil. Aplicația folosește același backend, deci preia automat noile credențiale. Singurul lucru necesar rămâne ca adresele mobile de întoarcere (`rentli://auth/callback`, `rentli://**`, `exp://**`) să fie în lista de redirecturi — sunt deja adăugate. Dacă în Google Cloud ai creat un client de tip „Web application”, este suficient; nu e nevoie de clienți separați iOS/Android atâta timp cât logarea trece prin backend.

## Ce nu se schimbă
- Nu modific codul de login din aplicație — butoanele Google/Apple rămân la fel.
- Nu ating cheile de hărți și nici alte integrări.
