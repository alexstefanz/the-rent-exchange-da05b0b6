# SEO: fiecare categorie și produs, pagină indexabilă corect

## Situația verificată azi

- Fiecare categorie, subcategorie și produs are deja adresă proprie (`/categorie/...`, `/subcategorie/...`, `/produs/...`), titluri, descrieri și date structurate.
- Problema reală: titlurile și descrierile sunt scrise de aplicație abia după ce pagina pornește în browser. Am verificat direct pagina live `rentli.ro/produs/ferestrau-spada`: ce primește un robot la prima cerere este titlul general al site-ului („Închiriază orice în România...”), nu titlul produsului. La fel și descrierea și imaginea de previzualizare.
- Harta site-ului (`sitemap.xml`) este un fișier fix, creat doar la publicare: conține 37 de produse și 12 categorii. Produsele noi apar în Google doar după o nouă publicare.

Deci paginile există, dar Google și rețelele sociale nu primesc conținutul potrivit de la prima cerere, iar produsele noi intră cu întârziere.

## Ce propun, în ordine

### Pasul 1 — Hartă a site-ului mereu actualizată
Harta se generează la cerere din baza de date (toate produsele active și aprobate, toate categoriile și subcategoriile), în loc de fișier fix. Produsele noi devin vizibile pentru Google în aceeași zi, fără publicare.

### Pasul 2 — Titlu, descriere și imagine corecte de la prima cerere
Pentru paginile de produs, categorie și subcategorie, cererile venite de la roboți (Google, Bing, Facebook, WhatsApp) primesc o pagină cu titlul, descrierea, imaginea și datele structurate ale produsului/categoriei respective. Vizitatorii obișnuiți văd exact site-ul de acum, neschimbat.

Rezultat: titluri corecte în Google și previzualizări corecte când cineva trimite un link pe WhatsApp sau Facebook.

### Pasul 3 — Conținut unic pe categorii
Fiecare categorie și subcategorie primește un scurt text propriu (2-3 paragrafe) și întrebări frecvente specifice. Fără text propriu, Google tratează aceste pagini ca fiind aproape identice și le indexează slab.

### Pasul 4 — Curățenie și verificare
- O singură adresă oficială: `rentli.ro` (fără www), consecvent peste tot.
- Produsele șterse sau dezactivate returnează „pagină inexistentă”, ca să nu rămână în index.
- Retrimitem harta în Google Search Console și verificăm indexarea după 1-2 săptămâni.

## Detalii tehnice

- Pasul 1: funcție nouă de backend `sitemap` care interoghează `products` (aprobate, active, nesterse), `platform_categories` și subcategoriile; `public/robots.txt` indică noua adresă; se păstrează și generarea la build ca rezervă.
- Pasul 2: funcție de backend `seo-prerender` care întoarce HTML-ul din `dist/index.html` cu blocul `<head>` completat pentru ruta cerută (titlu, descriere, canonical, og:*, JSON-LD `Product` / `CollectionPage` reutilizând logica din `src/lib/seoText.ts` și `src/data/categorySeo.ts`). Pe serverul Nginx propriu se adaugă o regulă care trimite cererile cu user-agent de robot către această funcție, doar pentru `/produs/*`, `/categorie/*`, `/subcategorie/*`. Codul aplicației rămâne neschimbat.
- Pasul 3: extinderea `src/data/categorySeo.ts` cu text introductiv și întrebări frecvente per categorie, afișate în `CategoryDetail.tsx` / `SubcategoryDetail.tsx`, plus JSON-LD `FAQPage`.
- Pasul 4: canonical deja calculat în `usePageSeo`; se fixează pe `https://rentli.ro`; `ProductDetail.tsx` marchează `noindex` + 404 pentru produse indisponibile.

## Ce nu se schimbă

- Design, fluxuri de închiriere, plăți, conturi.
- Aplicația mobilă.
