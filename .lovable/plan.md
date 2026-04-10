

## Plan: Performanță mobil 77% → 90%+ (FCP & LCP verde)

### Analiza problemei principale

Din raportul PageSpeed, LCP breakdown-ul arată clar bottleneck-ul:

```text
LCP = 4.3s
├── TTFB:                 0 ms    ✓ 
├── Resource load delay:  90 ms   ✓ (preload funcționează)
├── Resource load duration: 230 ms ✓
└── Element render delay: 1,970 ms ← PROBLEMA PRINCIPALĂ
```

Imaginea hero se încarcă rapid (320ms) dar **nu poate fi afișată** până când React nu parsează și execută 208 KiB de JS. Acest "element render delay" de aproape 2 secunde este cauza principală atât pentru FCP cât și LCP.

### Modificări

**1. Self-host fontul Plus Jakarta Sans (impact mare pe FCP)**
Google Fonts adaugă un request render-blocking pentru CSS (310ms). Descărcăm fișierele WOFF2 local și le declarăm cu `@font-face` + `font-display: swap` direct în `index.css`. Eliminăm complet referințele Google Fonts din `index.html`.

**2. Vite manual chunks — reduce main bundle parse time**
Adăugăm `build.rollupOptions.output.manualChunks` în `vite.config.ts` pentru a separa:
- `react` + `react-dom` → `vendor-react` (~40 KiB)
- `@supabase` → `vendor-supabase` (~50 KiB)
- `@tanstack/react-query` → `vendor-query`
- `lucide-react` → `vendor-icons`

Rezultat: bundle-ul principal scade de la 208 KiB la ~60-80 KiB, reducând parse time pe mobil cu ~500-800ms.

**3. Elimină parallax pe mobil (fix forced reflow)**
Scroll handler-ul cu `translateY` cauzează 62ms forced reflow. Pe mobil, dezactivăm complet parallax-ul (verificăm `window.innerWidth < 768` sau folosim `matchMedia`).

**4. Comprimă banner_hero.webp mai agresiv**
Bannerul e 134 KiB. Îl recomprimăm la quality 60 (vs curent ~75-80), țintind ~70-80 KiB. Pe mobil servim o versiune mai mică (max-width 768px).

**5. Lazy load Footer din Index.tsx**
Footer-ul e importat direct dar e complet sub fold. Îl wrappăm cu `lazy` + `Suspense`.

**6. Adaugă responsive hero cu `<picture>` + srcset**
Creăm o versiune mobilă a banner-ului (768px lățime, ~40 KiB) și folosim `<picture>` cu `<source media="(max-width: 768px)">`.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/index.css` | Adaug `@font-face` pentru Plus Jakarta Sans |
| `index.html` | Elimin Google Fonts links, adaug preload font WOFF2 |
| `vite.config.ts` | Adaug `manualChunks` |
| `src/pages/Index.tsx` | Dezactivez parallax pe mobil, lazy Footer, `<picture>` hero |
| `public/images/banner_hero.webp` | Recomprimat mai agresiv |
| `public/images/banner_hero_mobile.webp` | NOU - versiune 768px |
| `public/fonts/*.woff2` | NOU - fonturile self-hosted |

### Impact estimat

| Optimizare | Reducere estimată |
|---|---|
| Self-host font (elimină render-block) | -300-500ms FCP |
| Manual chunks (reduce parse time) | -500-800ms render delay |
| Banner mobil mai mic | -50-60 KiB, -200ms LCP |
| Elimină parallax pe mobil | -62ms reflow |
| Lazy Footer | -10-20 KiB din bundle inițial |

Target: FCP ~1.5-2.0s, LCP ~2.0-2.5s → scor 90+

