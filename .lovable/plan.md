## Diagnoză

- `index.html` are deja `<title>`, meta description, OG/Twitter tags și JSON-LD Organization + WebSite pentru domeniul rentli.ro. Este ok ca fallback pentru crawlere care nu execută JS.
- `src/hooks/useSEO.ts` există și scrie corect `title`, `description`, `canonical`, `og:*`, `twitter:*`, `robots` și JSON-LD la runtime.
- Doar **ProductDetail** îl folosește. Pe pagina de produs featured image este deja **prima imagine a produsului** (`seoFirstImage = images[0]`), plus canonical, JSON-LD Product cu offer/rating. Aici e ok — doar câteva îmbunătățiri mici.
- Toate celelalte pagini publice (Index, Categorii, CategoryDetail, SubcategoryDetail, Search, HowItWorks, AboutUs, Contact, HelpCenter, FAQ, UserProfile, paginile legale) rămân cu titlul și descrierea generică din `index.html`. Google le vede pe toate ca „Rentli - Închiriază Orice de la Oricine".
- `sitemap.xml` include produsele aprobate + categorii + pagini statice — ok. `robots.txt` blochează rutele private — ok.

## Ce voi face

### 1. Titluri și descrieri per pagină (via `useSEO`)

Adaug `useSEO({...})` în fiecare pagină publică, cu conținut bilingv (RO/EN prin `useLanguage`) și `canonical` self-referențial `${origin}${pathname}`:

| Rută | Titlu (RO) | Descriere (RO, ≤160c) |
|---|---|---|
| `/` | Rentli — Închiriază orice, oriunde în România | Marketplace peer-to-peer pentru închirieri. Unelte, camping, foto, sport și mai mult. Plată securizată, predare cu poze. |
| `/categorii` | Toate categoriile de închirieri — Rentli | Explorează unelte, sport, foto/video, camping, evenimente și multe altele pe Rentli. |
| `/categorie/:slug` | {NumeCategorie} de închiriat în România — Rentli | Închiriază {categorie} de la oameni verificați. Prețuri corecte, plată securizată, predare cu poze. |
| `/subcategorie/:id` | {NumeSubcategorie} — Rentli | Similar cu categoria părinte. |
| `/produs/:slug` | *(deja setat)* | *(deja setat)* |
| `/utilizator/:id` | {NumeUtilizator} — anunțuri pe Rentli | Descoperă produsele publicate de {nume} pe Rentli. |
| `/cauta` | Caută produse de închiriat — Rentli | Filtrează după categorie, oraș și preț. Găsește instant ce ai nevoie. |
| `/cum-functioneaza` | Cum funcționează Rentli — Ghid închirieri | Pași simpli pentru chiriași și proprietari: rezervare, plată blocată, predare cu poze, retur. |
| `/despre-noi` | Despre Rentli — Marketplace-ul de închirieri din România | Misiunea, echipa și povestea Rentli. |
| `/contact` | Contact — Rentli | Contactează echipa Rentli pentru suport, parteneriate sau întrebări. |
| `/centru-asistenta` | Centru de asistență — Rentli | Răspunsuri, ghiduri și articole pentru chiriași și proprietari. |
| `/intrebari-frecvente` | Întrebări frecvente — Rentli | Cele mai frecvente întrebări despre închirieri, plăți, KYC și taxe pe Rentli. |
| `/termeni-si-conditii`, `/politica-*` | {Titlu} — Rentli | Descriere scurtă pentru fiecare document legal. |
| `/auth`, `/checkout*`, `/profile`, `/mesaje`, `/rezervari*`, `/inchirieri*`, `/anunturi`, `/verificare`, etc. | „{Secțiune} — Rentli" + `noindex` | Pagini private, marcate noindex pentru siguranță (rămân blocate și în robots.txt). |

Pe fiecare pagină cu date dinamice (categorie, subcategorie, user), voi seta și `og:image` la o imagine relevantă (banner categorie sau, la profil, avatarul); dacă nu există, cade pe `og-image.webp` sitewide.

### 2. Featured image pe pagina de produs

Pagina `/produs/:slug` deja setează `og:image = images[0]`. Verific două aspecte:
- Prima imagine este forțată să fie absolute URL (deja se face cu `startsWith("http") ? url : ${origin}${url}`) — ok.
- Fallback la `og-image.webp` sitewide dacă produsul nu are imagini (evită preview gol) — voi adăuga.
- Adaug și `og:image:width`/`height` dinamic doar dacă e disponibil (opțional; îl las scos dacă nu e ușor de obținut).

Notă crucială: crawlerele sociale (Facebook, LinkedIn, WhatsApp) **nu execută JS** — vor vedea în continuare fallback-ul din `index.html`, nu prima imagine a produsului. Google, în schimb, execută JS și va indexa corect fiecare pagină. Pentru preview-uri sociale precise per-produs este nevoie de SSR, pe care aplicația nu îl are; îl semnalez explicit în răspuns, fără a modifica arhitectura.

### 3. JSON-LD suplimentar

- `/categorie/:slug`: `CollectionPage` cu `BreadcrumbList` Home → Categorii → {Categorie}.
- `/subcategorie/:id`: `CollectionPage` + `BreadcrumbList` cu 4 niveluri.
- `/utilizator/:id`: `ProfilePage`.
- `/cum-functioneaza`: `HowTo`.
- `/intrebari-frecvente`: `FAQPage` populat din datele din pagină.
- `/despre-noi`, `/contact`, `/centru-asistenta`, paginile legale: `WebPage` simplu.
- `/produs/:slug`: deja are `Product` + `Offer` + `AggregateRating` — ok.

### 4. Verificări finale

- `robots.txt` — nicio schimbare.
- `sitemap.xml` — nicio schimbare de structură; generatorul deja emite toate produsele aprobate + categoriile.
- Rulez o pasare peste toate paginile ca să confirm că fiecare are `useSEO` și pattern-ul standard.
- La final, declanșez `seo--trigger_scan` pentru re-verificare de către scannerul intern SEO.

## Fișiere ce vor fi modificate/create

```text
src/hooks/useSEO.ts                    (mic fallback la og:image dacă lipsește)
src/pages/Index.tsx
src/pages/Categories.tsx
src/pages/CategoryDetail.tsx
src/pages/SubcategoryDetail.tsx
src/pages/Search.tsx
src/pages/HowItWorks.tsx
src/pages/AboutUs.tsx
src/pages/Contact.tsx
src/pages/HelpCenter.tsx
src/pages/FAQ.tsx
src/pages/UserProfile.tsx
src/pages/ProductDetail.tsx            (fallback og:image + confirmare featured = images[0])
src/pages/legal/TermsAndConditions.tsx
src/pages/legal/PrivacyPolicy.tsx
src/pages/legal/CancellationPolicy.tsx
src/pages/legal/CookiePolicy.tsx
src/pages/Auth.tsx                     (noindex)
src/pages/Profile.tsx                  (noindex)
src/pages/AccountDetailsPage.tsx       (noindex)
src/pages/Checkout*.tsx                (noindex)
src/pages/Messages.tsx                 (noindex)
src/pages/FavoritesPage.tsx            (noindex)
src/pages/EarningsPage.tsx             (noindex)
src/pages/ReviewsPage.tsx              (noindex)
src/pages/NotificationsPage.tsx        (noindex)
src/pages/RentalsPage.tsx              (noindex)
src/pages/OwnerRentalsPage.tsx         (noindex)
src/pages/RentalDetailPage.tsx         (noindex)
src/pages/ListingsPage.tsx             (noindex)
src/pages/ActivityLogPage.tsx          (noindex)
src/pages/UserTickets.tsx              (noindex)
src/pages/KycVerification.tsx          (noindex)
src/pages/DeactivateAccount.tsx        (noindex)
```

Nu modific: `index.html`, `sitemap.xml`, `robots.txt`, backend, business logic sau UI vizual. Modificările sunt strict `<head>` per rută.
