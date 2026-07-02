# Integrare Google Analytics 4 (G-GWKQ78Q43C)

## 1. Tracking pe site (frontend)

- Adaug tag-ul GA4 (`gtag.js`) în `index.html` cu ID-ul `G-GWKQ78Q43C`, încărcat `async`, respectând bannerul de cookie consent existent:
  - Inițial `gtag('consent', 'default', { analytics_storage: 'denied' })`.
  - După acceptare în banner: `gtag('consent', 'update', { analytics_storage: 'granted' })`.
- Creez `src/lib/analytics.ts` cu helper `trackPageview(path)` și `trackEvent(name, params)`.
- Adaug un `RouteTracker` în `src/App.tsx` care ascultă `useLocation()` și trimite `page_view` pe fiecare schimbare de rută SPA (altfel GA4 vede doar prima încărcare).
- Nu trimit date pe rute private sensibile (checkout cu tokenuri, admin) — trimit doar `pathname`, fără query params.

## 2. Dashboard în Admin

- Creez Edge Function `ga4-report` (`verify_jwt = true`, restricționată la useri cu rol `admin` prin `has_role`) care:
  - Cheamă **Google Analytics Data API v1** (`runReport`) folosind un **Service Account** (JSON key stocat ca secret).
  - Returnează metrici agregate: `activeUsers`, `sessions`, `screenPageViews`, `averageSessionDuration`, `bounceRate`, plus serii pe zi și top 10 pagini / surse de trafic (`sessionSource/Medium`, `country`, `deviceCategory`).
  - Parametri: `range` (7d / 30d / 90d).
- Adaug pagină nouă `src/pages/admin/AdminAnalytics.tsx` (link în meniul admin):
  - Selector interval (7/30/90 zile).
  - Carduri KPI + grafic linie pageviews/zi (Recharts, deja folosit).
  - Tabele: top pagini, surse de trafic, țări, device.
  - Buton "Deschide în Google Analytics".
- Dacă cheia service account lipsește, dashboard-ul afișează stare "neconfigurat" cu instrucțiuni + link direct GA.

## 3. Secrete necesare

Pentru dashboard e nevoie de acces API. Îți voi cere după aprobare:
- `GA4_PROPERTY_ID` — numeric, din GA4 → Admin → Property Settings.
- `GA4_SERVICE_ACCOUNT_JSON` — JSON complet al unui Service Account cu rol **Viewer** adăugat în GA4 (Admin → Property Access Management).

Tagul de tracking (pasul 1) funcționează imediat, fără secrete.

## Detalii tehnice

- Consent Mode v2 aliniat cu `CookieConsentBanner` existent (localStorage key deja definit).
- Edge function respectă limitele existente: rate-limit, `has_role('admin')`, CORS.
- SPA tracking: single `config` call fără `send_page_view`, apoi `gtag('event','page_view',{page_path,page_location,page_title})` la fiecare navigare.
- Fără PII trimis către GA (fără email, fără userId).

## Ordine de livrare

1. Tracking + consent + route tracker (imediat, funcțional cu ID-ul dat).
2. Dashboard admin + edge function (după ce îmi dai `GA4_PROPERTY_ID` + service account JSON).
