# Fă Rentli vizibil pe Google

Scop: să apară rentli.ro în Google în următoarele 1-2 săptămâni.

## Ce fac

### 1. SEO on-page în `index.html`
- `<link rel="canonical" href="https://rentli.ro/" />`
- Meta tag de verificare Google Search Console (token obținut prin API-ul Site Verification)
- Open Graph: `og:image` cu o imagine de brand (1200x630) în loc de placeholder-ul Lovable
- JSON-LD `Organization` + `WebSite` (cu `SearchAction` pentru sitelinks searchbox)
- Title/description deja există — le verific și le optimizez dacă e cazul

### 2. `public/sitemap.xml` generat automat
- Script `scripts/generate-sitemap.ts` rulat pe `predev` și `prebuild`
- Include rutele publice statice (`/`, `/cum-functioneaza`, `/categorii`, `/contact`, etc.)
- Include rutele dinamice: toate produsele aprobate (folosind slug-ul SEO existent) și categoriile din `platform_categories`
- `BASE_URL = "https://rentli.ro"`

### 3. `public/robots.txt`
- `Allow: /` pentru toți crawlerii
- `Disallow:` pentru rute interne (`/admin`, `/profil`, `/inchirieri`, `/rezervari`, `/checkout`, `/auth`, `/lovable/*`)
- `Sitemap: https://rentli.ro/sitemap.xml`

### 4. Verificare în Google Search Console
- Cer token META prin connector Google Search Console
- Îl pun în `index.html`
- După deploy, declanșez verify + adaug `https://rentli.ro/` ca proprietate
- Submit sitemap.xml prin API

### 5. Imagine OG de brand
- Generez o imagine 1200x630 cu logo + tagline Rentli pentru `og:image`
- Salvată în `public/og-image.jpg`

### 6. Scan SEO final
- Rulez `seo--trigger_scan` ca să confirm că nu mai sunt issues

## Ce NU fac (out of scope)
- Nu modific funcționalitatea aplicației, RLS, edge functions sau plăți
- Nu schimb routing-ul existent
- Nu adaug per-page SEO (Helmet) acum — doar sitewide; pot face follow-up dacă vrei meta tags dinamice per produs/categorie

## Note tehnice
- Domeniul live e `https://rentli.ro` (cu redirect de la `www`)
- Folosesc connector-ul Google Search Console deja conectat
- Indexarea efectivă durează zile-săptămâni după submit; partea tehnică se rezolvă azi
