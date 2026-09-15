# Avertismentul „Dangerous site" la conectarea cu Google

## Ce am verificat acum

Am testat conectarea cu Google pe rentli.ro: butonul funcționează, ecranul Google se deschide corect cu clientul Rentli, iar adresa de întoarcere folosită este `https://www.rentli.ro/~oauth/callback`. Deci login-ul în sine nu este stricat.

Ecranul roșu pe care l-ai primit nu vine de la aplicație. Este avertismentul „Navigare sigură" al Chrome: Google a marcat adresa pe care ai fost trimis după alegerea contului. Cel mai probabil este vorba de domeniul `www.rentli.ro` (varianta cu www), raportat automat ca suspect.

Nu este confirmat încă exact ce adresă a fost marcată — primul pas al planului este să aflăm asta.

## Pași

1. **Aflăm adresa exact marcată**
   - Pe ecranul roșu, apeși „Details" → apare linkul blocat. Îmi trimiți acel link.
   - În paralel verific starea site-ului în Google Search Console, secțiunea „Security & Manual Actions" (proprietatea `rentli.ro` este deja conectată), ca să văd dacă Google a raportat o problemă și care.

2. **Dacă Google a marcat `www.rentli.ro`**
   - Adăugăm și verificăm proprietatea `https://www.rentli.ro/` în Search Console (momentan există doar cea fără www), ca să putem cere revizuirea și pentru ea.
   - Trimitem cerere de revizuire („Request review") din Search Console. Google răspunde de regulă în 1–3 zile.

3. **Reducem riscul din fluxul de login**
   - În aplicație, conectarea cu Google folosește domeniul cu `www`, deși site-ul principal este `rentli.ro`. Redirecționăm consecvent pe `rentli.ro`, ca utilizatorul să nu mai fie plimbat între două domenii în timpul autentificării — acesta este exact tiparul pe care Chrome îl consideră suspect.
   - Se păstrează ambele adrese de întoarcere în contul Google Cloud, deci nimic nu se strică.

4. **Retestez** conectarea în incognito pe `rentli.ro` și confirm dacă avertismentul a dispărut.

## Ce nu se schimbă

- Credențialele Google și brandingul „Rentli" rămân neatinse.
- Aplicația de mobil nu este afectată.

## Detalii tehnice

- Client OAuth: `582322940802-…`, redirect folosit în web: `https://www.rentli.ro/~oauth/callback`.
- Pasul 3 înseamnă normalizarea domeniului (redirect `www` → apex) la nivel de hosting/aplicație, astfel încât fluxul OAuth să ruleze pe o singură origine.
- Verificarea Safe Browsing se face din Search Console → Security & Manual Actions; nu există fix în cod pentru delistare, doar cererea de revizuire.
