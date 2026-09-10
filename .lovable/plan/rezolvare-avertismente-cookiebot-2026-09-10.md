# Rezolvare avertismente Cookiebot

Raportul de scanare (rentli.ro, 08/09/2026) semnalează 3 probleme reale. Toate se pot rezolva.

## Ce e în neregulă acum

1. **Google Consent Mode „At risk”** — Google Analytics pornește fără semnal implicit de refuz. În cod nu există niciun bloc `consent default`, deci Google nu primește „denied” înainte de acceptare.
2. **3 cookie-uri neclasificate** — `rentli_visitor_id` și `rentli_recently_viewed_v1` (salvate de site la vizitarea unui produs) și `__dpl` (pus de serverul/CDN-ul de găzduire).
3. **Cookie-uri setate înainte de consimțământ** — cele două de mai sus se scriu imediat la deschiderea unei pagini de produs, fără să aștepte acceptul.

Ce NU e o problemă: `__cf_bm`, `CookieConsent`, `SESS#` sunt strict necesare și corect încadrate. Scriptul Cookiebot este deja primul din pagină, cu blocare automată activă.

## Ce voi face

**1. Consent Mode v2 corect**
- Adaug, imediat înainte de tag-ul Google, blocul implicit „denied” pentru analytics, publicitate și personalizare, plus `wait_for_update`.
- Leg evenimentele Cookiebot (acceptare/refuz/schimbare) de actualizarea consimțământului Google, ca semnalul să treacă pe „granted” doar după accept.

**2. Amân cookie-urile proprii până la accept**
- `rentli_visitor_id` (numărare vizualizări produs) se creează doar dacă utilizatorul a acceptat categoria statistici; altfel vizualizarea nu se contorizează.
- „Produse vizitate recent” se salvează doar cu acceptul pentru preferințe; fără accept, secțiunea rămâne goală, fără eroare.
- Dacă utilizatorul își retrage consimțământul, valorile salvate se șterg.

**3. Clasificare manuală în Cookiebot (pas în contul tău, îl fac eu ghidat sau îl faci tu)**
- `rentli_visitor_id` → Statistici, descriere: identificator anonim pentru numărarea unică a vizualizărilor unui anunț.
- `rentli_recently_viewed_v1` → Preferințe, descriere: reține ultimele anunțuri vizitate pentru afișare rapidă.
- `__dpl` → Necesare, descriere: cookie tehnic al platformei de găzduire pentru rutarea către versiunea corectă a site-ului.

## Detalii tehnice

- `index.html`: bloc `gtag('consent','default',{...denied, wait_for_update:500})` înaintea `gtag/js`, plus listener `CookiebotOnAccept` / `CookiebotOnDecline` care apelează `gtag('consent','update',...)` pe baza `Cookiebot.consent.statistics|marketing|preferences`.
- `src/lib/analytics.ts`: extind `setAnalyticsConsent` la toate semnalele GCM v2 și expun un helper de citire a consimțământului.
- `src/pages/ProductDetail.tsx`: apelul `track_product_view` condiționat de consimțământul statistici.
- `src/hooks/useRecentlyViewed.ts`: scriere/citire condiționată de consimțământul preferințe, curățare la retragere.
- `__dpl` provine din stratul de hosting, nu din codul aplicației — se rezolvă doar prin clasificare (sau prin dezactivarea sa la nivel de server, dacă e posibil).

După implementare, se rescanează domeniul în Cookiebot pentru a confirma statusul „No risk”.
