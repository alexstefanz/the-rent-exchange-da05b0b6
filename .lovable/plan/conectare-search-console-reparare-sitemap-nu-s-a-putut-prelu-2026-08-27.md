# Conectare Search Console + reparare sitemap „Nu s-a putut prelua”

## Ce am verificat acum
- `https://rentli.ro/sitemap.xml` răspunde **200**, `content-type: text/xml`, XML valid, cu 713 linii și `<loc>` pe originea corectă (`https://rentli.ro/...`). Deci fișierul e în regulă în acest moment.
- `robots.txt` îl anunță corect: `Sitemap: https://rentli.ro/sitemap.xml`.
- Homepage-ul nu e pe noindex (verificat în cod și în HTML-ul live).
- În Lovable **nu e conectat niciun cont Google Search Console** la proiect, deci nu pot citi acum starea reală raportată de Google (screenshot-ul arată „Nu s-a putut prelua” pentru sitemap-ul trimis pe 27 aug. 2026).

## Ce voi face
1. **Conectez contul Google Search Console la proiect** (card de conectare în chat, alegi contul care deține proprietatea `https://rentli.ro/`).
2. **Listez proprietățile verificate** și selectez exact `https://rentli.ro/` (URL-prefix), fără să ghicesc identificatorul.
3. **Citesc starea exactă a sitemap-ului** raportată de Google (`GET .../sitemaps/https%3A%2F%2Frentli.ro%2Fsitemap.xml`) — ca să văd dacă eroarea persistă sau a fost o preluare eșuată temporar, și dacă URL-ul trimis e chiar cel corect (în screenshot coloana e tăiată).
4. **Retrimit sitemap-ul** (`PUT` pe aceeași cale) ca să forțez o nouă preluare, acum că fișierul răspunde 200.
5. **Inspectez homepage-ul** (`urlInspection/index:inspect`) ca să raportez starea reală de indexare a lui `https://rentli.ro/` — indexat / descoperit-neindexat / canonical ales de Google.

## Ce nu pot face prin API
„Request indexing” (recrawl la cerere) nu există în API — rămâne pas manual pentru tine în Search Console → Verificarea adresei URL → Solicită indexarea. Îți spun exact ce URL-uri merită trimise după ce văd rezultatul inspecției.

## Detalii tehnice
- Fără modificări de cod în acest pas; sitemap-ul și `robots.txt` sunt deja valide.
- Dacă inspecția arată o problemă reală (ex. canonical greșit sau sitemap invalid pe o altă cale), revin cu un plan separat pentru fix în `scripts/generate-sitemap.ts` / `public/robots.txt`.
