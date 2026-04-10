

## Plan: Performanță mobil 83% → 90%+ (FCP & LCP verde)

### Analiza curentă
- **FCP 3.3s** (verde = sub 1.8s) — principala cauză: Google Fonts render-blocking + CSS render-blocking
- **LCP 3.7s** (verde = sub 2.5s) — banner hero 134 KiB, JS bundle 225 KiB, font delay
- **TBT 40ms** și **CLS 0.002** — deja excelente
- Cache-ul pe assets lipsește (raportul arată "None" pe toate fișierele din `/assets/`)

### Probleme identificate și soluții

**1. Google Fonts blochează renderul (cel mai mare impact pe FCP)**
Fontul „Plus Jakarta Sans" e încărcat ca `<link rel="stylesheet">` — blochează FCP complet. 
- Soluție: schimb la `font-display: swap` prin adăugarea `&display=swap` (deja e acolo) dar MUTĂM la încărcare asincronă folosind pattern-ul `media="print" onload="this.media='all'"`.
- Alternativ, self-host fontul cu `@font-face` și `font-display: swap` inline în CSS — elimină complet dependența de Google Fonts ca render-blocking.

**2. Preload-ul bannerului nu funcționează în producție**
`/src/assets/banner_hero.webp` e un path Vite dev — în build devine `/assets/banner_hero-BC3jyQK-.webp`. Preload-ul din `index.html` nu matchează.
- Soluție: Mut `banner_hero.webp` în `/public/images/` și referențiez direct ca `/images/banner_hero.webp`. Preload-ul va funcționa.

**3. Cache headers lipsesc pe assets**
Raportul arată "Cache TTL: None" pe toate JS/CSS/WebP-urile. Fișierul `_headers` există dar probabil nu se aplică.
- Soluție: Extind `_headers` cu reguli mai specifice și verific formatul.

**4. Bundle JS principal prea mare (225 KiB)**
Index page e importat direct (nu lazy) în App.tsx, ceea ce e corect (e homepage). Dar Navbar, Footer, HeroSearchForm sunt importuri directe.
- Soluție: Lazy load `Footer` (e sub fold). Lazy load `CookieConsent`, `SupportChatWidget`, `AdminSupportWidget` din `App.tsx` — nu sunt critice la FCP.

**5. Unused JS (110 KiB)**
- `SupportChatWidget` și `AdminSupportWidget` sunt importate eager în App.tsx dar rareori vizibile la load.
- Soluție: lazy import cu `requestIdleCallback` delay.

### Modificări concrete

| Fișier | Ce se schimbă |
|---|---|
| `index.html` | Font async loading, fix preload path, inline critical font-face |
| `public/images/banner_hero.webp` | Mut din `src/assets/` în `public/images/` |
| `src/pages/Index.tsx` | Referință banner din `/images/banner_hero.webp` în loc de import |
| `src/App.tsx` | Lazy load `SupportChatWidget`, `AdminSupportWidget`, `CookieConsent` |
| `public/_headers` | Verificare / completare cache rules |
| `src/components/layout/Navbar.tsx` | Lazy load `Footer` dacă nu e deja |

### Impact estimat
| Optimizare | Reducere |
|---|---|
| Font async (nu mai blochează) | -500ms FCP |
| Preload banner funcțional | -300ms LCP |
| Lazy widgets din App.tsx | -30-50 KiB din bundle inițial |
| Cache headers | Repeat visits mai rapide |

Target: FCP ~1.5-2.0s, LCP ~2.0-2.5s → scor 90+

