# Optimizare SEO: titluri și descrieri (Homepage, Categorii, Produse)

## Ce există deja (verificat)

- `index.html` are titlu, descriere, canonical `https://rentli.ro/`, OG/Twitter complet, JSON-LD Organization + WebSite (SearchAction).
- Homepage, Categorii, Categorie, Subcategorie, Căutare și Produs setează deja titlu/descriere dinamic prin `useSEO` / `usePageSeo`, cu canonical self-referential.
- Produsul are JSON-LD `Product` cu `Offer` și `AggregateRating`; categoria are `CollectionPage` + `BreadcrumbList`.
- `robots.txt` blochează corect zonele private; `sitemap.xml` are 135 URL-uri.

Deci baza e bună. Problemele rămase sunt de calitate a textelor și de consistență, nu de lipsă totală.

## Probleme identificate

1. **Titlu produs prea lung și fără cuvântul-cheie de intenție.** Formatul actual `Titlu - Oraș | Rentli` poate depăși 60 de caractere și nu conține „închiriere/de închiriat”, care e termenul căutat.
2. **Descriere produs = primele 157 de caractere din descrierea scrisă de utilizator.** Adesea începe cu text irelevant („Bună, ofer spre...”) sau e goală, și nu conține preț/oraș.
3. **Titlul static din `index.html` diferă de cel din React** („Rentli - Închiriază Orice de la Oricine”). Crawlerele social (fără JS) văd mereu varianta homepage pe orice pagină.
4. **Homepage fără JSON-LD specific paginii** (doar Organization/WebSite globale) și fără menționarea categoriilor principale în descriere.
5. **Pagina de categorie**: descrierea e identică ca șablon pentru toate cele 12 categorii → conținut aproape duplicat în SERP; lipsește numărul de anunțuri și exemple de subcategorii.
6. **Parametri de URL** (`?view=map`, `?judet=`, `?pagina=`) nu generează canonical separat — deja corect (canonical fără query), dar variantele filtrate nu sunt marcate `noindex`, deci pot apărea în index ca duplicate.

## Ce voi face

### Homepage (`src/pages/Index.tsx` + `index.html`)
- Titlu RO: „Închiriază orice în România — unelte, foto, camping | Rentli” (sub 60 caractere), EN echivalent.
- Descriere RO axată pe intenție + încredere: marketplace P2P, plată securizată, predare cu poze, verificare identitate (max 155 caractere).
- Aliniez titlul/descrierea din `index.html` cu varianta React (aceleași valori în `<title>`, `description`, `og:*`, `twitter:*`).
- Adaug JSON-LD `ItemList` cu cele 12 categorii principale pe homepage.

### Pagini de categorie (`src/pages/CategoryDetail.tsx`)
- Titlu: „{Categorie} de închiriat în România — prețuri de la X lei/zi | Rentli”, cu fallback fără preț.
- Descriere unică per categorie: un dicționar nou `src/data/categorySeo.ts` cu text RO/EN scris manual pentru fiecare din cele 12 categorii (menționează 3–4 subcategorii reprezentative + orașe mari).
- Păstrez `CollectionPage` + `BreadcrumbList`; adaug `numberOfItems`.
- Marchez `noindex,follow` doar când există filtre active în URL (județ/localitate/subcategorie/preț/pagina > 1), ca să nu diluez indexarea.

### Pagini de produs (`src/pages/ProductDetail.tsx`)
- Titlu: „Închiriere {Titlu} în {Oraș} — {Preț} lei/zi | Rentli”, trunchiat inteligent la ~60 de caractere fără să taie cuvinte.
- Descriere generată: preț/zi + oraș + prima frază curată din descrierea utilizatorului (curățată de saluturi și spații multiple), fallback pe text standard dacă descrierea lipsește sau e sub 40 de caractere.
- Adaug în JSON-LD `Product`: `sku` (public id), `itemCondition`, `priceValidUntil` și `areaServed`, plus `BreadcrumbList` (Acasă → Categorie → Produs).

### Pagina „Toate categoriile” (`src/pages/Categories.tsx`)
- Adaug JSON-LD `CollectionPage` + `BreadcrumbList` și îmbunătățesc descrierea cu enumerarea categoriilor.

## Detalii tehnice

- Textele noi respectă limitele: titlu ≤ 60, descriere ≤ 155 caractere; adaug un helper mic `truncateForMeta()` în `src/lib/` folosit de toate paginile.
- Toate textele sunt bilingve (RO/EN) prin `language` din `LanguageContext`, ca restul aplicației.
- Nu modific `robots.txt`, sitemap-ul, rutele sau conținutul vizibil al paginilor — doar `<head>` și noul fișier de texte SEO.

## Limitare de menționat

Aplicația e un SPA Vite fără randare pe server: Googlebot execută JS și vede titlurile per pagină, dar crawlerele de preview social (Facebook, LinkedIn, WhatsApp, Slack) citesc doar `index.html`, deci vor arăta mereu preview-ul global Rentli, nu cel al produsului. Pentru preview-uri sociale corecte per produs e nevoie de SSR — se poate obține migrând la template-ul nou Lovable („/” în chat → „Migrate to TanStack Start”); [ce aduce upgrade-ul](https://lovable.dev/blog/building-apps-using-tanstack-start).
