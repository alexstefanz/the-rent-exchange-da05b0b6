# Finalizarea verificării brandului Rentli în Google

## Diagnostic verificat

- Google Search Console confirmă că `https://rentli.ro/` este proprietate verificată, indexată și accesibilă.
- `https://www.rentli.ro/` redirecționează către `https://rentli.ro/` și nu este aceeași proprietate URL-prefix în Search Console.
- Captura Google indică acum o singură problemă: homepage-ul configurat ca `https://www.rentli.ro` nu este înregistrat ca proprietate a ta.
- Pagina principală publică identifică Rentli, explică serviciul și include în footer linkul public către politica de confidențialitate.

## Ce trebuie făcut în Google Cloud

1. În **Google Cloud Console → Google Auth Platform / OAuth consent screen → Branding**, setează exact:
   - **App home page:** `https://rentli.ro/`
   - **Privacy policy:** `https://rentli.ro/politica-confidentialitate`
   - **Terms of service:** `https://rentli.ro/termeni-si-conditii`
   - **Authorized domain:** `rentli.ro`
2. Salvează modificările.
3. În fereastra „Branding verification issues”, selectează **I have fixed the issues**.
4. Apasă **Proceed** pentru o nouă verificare.
5. Nu selecta **I believe the issues found are incorrect**, deoarece verificarea precedentă a folosit într-adevăr varianta `www`, care nu corespunde proprietății URL-prefix confirmate.

## Alternativă

Dacă vrei obligatoriu să păstrezi `https://www.rentli.ro` în Branding, trebuie adăugată și verificată separat proprietatea URL-prefix `https://www.rentli.ro/` în Google Search Console. Varianta fără `www` este mai rapidă și corespunde deja adresei canonice a site-ului.

## După retrimitere

- Google va reanaliza brandingul; aprobarea nu este instantanee.
- După aprobare, verificăm din nou ecranul de autentificare Google pe web și mobil pentru numele și logo-ul Rentli.
- Nu este necesară nicio modificare în aplicație pentru problema indicată în captura actuală.
