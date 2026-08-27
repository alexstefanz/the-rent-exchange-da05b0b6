Plan: Optimizare favicon pentru recrawl rapid

## Scop
Reduce timpul până când noul favicon este preluat de Google Search, minimizând cache-ul la nivel de origin și forțând re-descărcarea fișierului.

## Ce se va modifica

1. `index.html`
   - Adaugă parametru de cache-busting la toate link-urile de favicon (ex: `/icon-48.png?v=2`).
   - Păstrează `icon-48.png` primul în `<head>`, conform cerinței Google pentru faviconul din SERP.

2. `public/_headers`
   - Reduce `max-age` pentru `/icon-48.png`, `/favicon.ico`, `/favicon-192.png`, `/favicon-512.png` și `/apple-touch-icon.png` de la 86400 la 0.
   - Adaugă `must-revalidate` și `no-cache` pentru aceste fișiere, astfel încât Googlebot să primească mereu versiunea curentă de pe origin.
   - Păstrează regulile existente pentru `/assets/*`, `/fonts/*` și `/images/*` neschimbate.

## Ce NU se va modifica
- Nu se schimbă conținutul imaginilor PNG/ICO existente.
- Nu se modifică alte head tags, canonical, og:* sau JSON-LD.

## Rezultat așteptat
După publicare, pagina root va returna HTML necache-uit, iar favicon-urile vor fi re-validate la fiecare cerere, eliminând riscul ca Google să păstreze în cache versiunea veche a iconiței. Timpul total rămâne totuși dependent de crawl calendar al Google (3–14 zile), dar nu va mai fi întârziat suplimentar de cache-ul de 1 zi al origin.
