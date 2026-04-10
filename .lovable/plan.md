

## Plan: Optimizare performanță mobil (PageSpeed 67 → ~85+)

Pe baza raportului PageSpeed, principalele probleme sunt:
- **LCP 7.2s** — imaginea hero `banner_hero.png` (232 KiB PNG) nu e descoperită din HTML, are delay mare
- **Logo** `rentli_logo.png` — 356 KiB PNG afișat la 190x70px (fișierul e 796x294). Cea mai mare risipă.
- **FCP 3.2s** — JS-ul trebuie parsat înainte ca imaginea hero să fie încărcată
- **Imagini produse pe mobil** — servite la 480px dar afișate la ~320px

### Modificări

**1. Convertire imagini statice la WebP (logo + banner)**
- Convertesc `rentli_logo.png` → `rentli_logo.webp` (redimensionat la ~240x96, ~5-10 KiB vs 356 KiB)
- Convertesc `banner_hero.png` → `banner_hero.webp` (compresie WebP, ~50-80 KiB vs 232 KiB)
- Păstrez PNG-urile ca fallback dar importul se face pe WebP
- Actualizez importurile în: `Navbar.tsx`, `Footer.tsx`, `Auth.tsx`, `Index.tsx`

**2. Preload LCP image din HTML (`index.html`)**
- Adaug `<link rel="preload" as="image" href="/src/assets/banner_hero.webp" type="image/webp">` — face imaginea hero descoperibilă imediat, fără a aștepta JS
- Alternativ, mut banner-ul hero în `/public/` și adaug preload direct pe calea finală

**3. Dimensiuni explicite pe logo (fix CLS)**
- Adaug `width` și `height` pe `<img>` logo-ul din Navbar (lipsesc conform raportului)

**4. Imagini produse mai mici pe mobil**
- În `imageUtils.ts`, adaug un nou preset `cardMobile: { width: 320, quality: 70 }`
- În `FeaturedListings.tsx`, folosesc `cardMobile` pe ecrane mici (via `window.innerWidth` sau direct hardcodat la 320)

**5. Lazy load componente sub fold**
- `FeaturedListings` și secțiunea CTA banner din `Index.tsx` — wrap cu `lazy` + `Suspense` sau IntersectionObserver

### Impact estimat
| Optimizare | Economie |
|---|---|
| Logo WebP + resize | ~350 KiB |
| Banner WebP | ~110 KiB |
| Preload LCP | -500ms+ LCP |
| Card mobile 320px | ~30% per imagine |

### Fișiere afectate
- **NOU**: `src/assets/rentli_logo.webp`, `src/assets/banner_hero.webp`
- **EDIT**: `index.html`, `src/pages/Index.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/pages/Auth.tsx`, `src/lib/imageUtils.ts`, `src/components/home/FeaturedListings.tsx`

