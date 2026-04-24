

## Plan: Banner hero de calitate înaltă pe mobil (HiDPI)

### Problemă

Imaginea curentă pentru mobil (`/images/banner_hero_mobile.webp`) are doar **768×435 px**. Pe un telefon modern de 390 CSS px lățime cu `devicePixelRatio` 2 sau 3 (iPhone, majoritatea Android-urilor flagship), browser-ul are nevoie de o imagine fizică de **780–1170 px lățime**, plus încă ~30% în plus pentru înălțimea de `130%` folosită de efectul parallax. Rezultatul: imaginea e upscalată semnificativ → aspect blurry, mai ales pe ecranele Retina.

În plus, `<source>` curent nu folosește `srcSet` cu density descriptors (`1x`, `2x`, `3x`), deci browser-ul nu poate alege o variantă HiDPI nici dacă ar exista.

### Soluție

#### 1. Generez 2 noi variante mobil HiDPI

Pornind de la asset-ul desktop existent (1920×1088), creez:
- `banner_hero_mobile@2x.webp` — **1536×870 px**, quality 78 (~ 90–110 KB)
- `banner_hero_mobile@3x.webp` — **2304×1305 px**, quality 72 (~ 160–200 KB)

Păstrez și `banner_hero_mobile.webp` existent (768×435) ca fallback `1x` pentru telefoane low-end / conexiuni slabe.

Cropping: păstrez același aspect ratio vertical-friendly ca asset-ul mobil curent (16:9 ușor). Quality un pic mai joasă pentru `@3x` ca să nu exagerez payload-ul, dar la densitate 3x diferența nu se observă vizual.

#### 2. Actualizez `<picture>` în `src/pages/Index.tsx` cu density descriptors

```tsx
<source
  media="(max-width: 768px)"
  type="image/webp"
  srcSet="/images/banner_hero_mobile.webp 1x, /images/banner_hero_mobile@2x.webp 2x, /images/banner_hero_mobile@3x.webp 3x"
/>
```

Browser-ul va alege automat varianta potrivită în funcție de `devicePixelRatio`. Pe iPhone (DPR 2 sau 3) va descărca direct varianta HD.

#### 3. (Opțional, dacă rămâne timp) Adaug `width`/`height` pe `<img>`

Pentru a evita CLS și a ajuta browser-ul cu layout-ul: `width={1920} height={1088}`. Nu schimbă vizualul (e tot `object-cover`), dar îmbunătățește scorul Core Web Vitals.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `public/images/banner_hero_mobile@2x.webp` | **Creat** — 1536×870, quality 78 |
| `public/images/banner_hero_mobile@3x.webp` | **Creat** — 2304×1305, quality 72 |
| `src/pages/Index.tsx` | `<source srcSet>` cu density descriptors `1x`/`2x`/`3x`; opțional `width`/`height` pe `<img>` |

### Rezultat

- Pe telefoane HiDPI (DPR 2/3) imaginea hero apare clară, fără blur, chiar și cu efectul parallax care o întinde la 130%.
- Pe telefoane low-end (DPR 1) sau conexiuni slabe, browser-ul descarcă în continuare varianta mică de 35 KB.
- Desktop nu e afectat (folosește în continuare `banner_hero.webp` 1920×1088).

