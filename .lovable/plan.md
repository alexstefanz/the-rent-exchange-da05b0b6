## Goal

Redesign complet al paginii `src/pages/CategoryDetail.tsx` într-o experiență de discovery marketplace premium (Airbnb/Turo style), păstrând identitatea Rentli (#F59E0B, Plus Jakarta Sans, 12px radius, fotografii realiste). Focus pe claritate, mobile-first și micro-interactions — nu pe încărcare vizuală.

## Out of scope

- Nu redesign global la `ProductCard` (folosit în multe locuri). Adaug doar overlay-uri opționale (favorite count, "Nou", "Trending") prin prop-uri noi cu default off, păstrând look-ul curent.
- Fără hartă interactivă acum — pregătesc doar toggle-ul Grid/Hartă disabled cu tooltip "În curând".
- Fără modificări de schemă DB. Folosesc câmpurile existente: `profiles.kyc_status`, `products.created_at`, agregări existente. Trust signals care lipsesc (ex. "răspunde rapid") nu se afișează decât dacă datele există — degradare elegantă.
- Fără infinite scroll real (necesită paginare în RPC `search_products`). Implementez "Load more" client-side cu slice de 24 + skeletons; las hook-ul pregătit pentru paginare server-side ulterior.

## Architecture

Un fișier principal `CategoryDetail.tsx` rescris + 6 componente noi mici sub `src/components/category/`:

```
src/components/category/
  CategoryHero.tsx          // Hero premium cu stats + trust badges
  SubcategoryPills.tsx      // Bara orizontală swipe cu pills active
  CategorySearchBar.tsx     // "Caută în {categorie}" cu sugestii live
  StickyFilterBar.tsx       // Sticky desktop + glass + quick chips
  MobileFilterSheet.tsx     // Bottom sheet full-screen pentru mobil
  DiscoveryRails.tsx        // Rails: Trending / Noi / Aproape de tine
  EmptyCategoryState.tsx    // Empty state cu sugestii alternative
```

## Section-by-section

### 1. CategoryHero (înlocuiește hero-ul actual)

- Înălțime 360px desktop / 280px mobil, imagine de fundal `object-cover` cu **gradient overlay dual**: `from-black/70 via-black/40 to-transparent` (jos→sus) ca textul să rămână lizibil fără să stingă fotografia.
- Subtle motion: imaginea face un slow zoom (scale 1 → 1.05) pe 12s în loop via `animate-[ken-burns]` keyframe nou în `tailwind.config.ts`. Respectă `prefers-reduced-motion`.
- Conținut centrat-stânga (max-w-3xl):
  - Breadcrumb mic alb/70 (`Acasă › Categorii › {nume}`)
  - H1 mare (`text-4xl md:text-5xl font-heading`)
  - Stats live row (chips translucide `bg-white/10 backdrop-blur ring-1 ring-white/20`):
    - `{N} produse disponibile`
    - `{X} adăugate săptămâna aceasta` (calculat client-side: `created_at >= now-7d`)
    - `Închirieri rapide în {topCity}` (orașul cu cele mai multe produse din categorie)
  - Trust badges row (4 chip-uri text + ✓ icon, alb 80%):
    - "Produse verificate" • "Plăți securizate" • "Proces verbal digital" • "Suport 7 zile/săpt"

### 2. SubcategoryPills (sub hero, sticky-able)

- Bară orizontală scrollabilă cu pills (rounded-full px-4 py-2):
  - Prima pill "Toate {N}", apoi câte una/subcategorie cu count.
  - Active state: `bg-foreground text-background` cu animation `transition-all` + subtil scale-up.
  - Mobile: scroll-snap-x mandatory, edge fades stânga/dreapta cu `mask-image` linear-gradient.
  - Desktop: chevron arrows ce apar la hover dacă scroll overflow.

### 3. CategorySearchBar

- Input pill mare (h-12) cu icon Search stânga, placeholder "Caută în {categorie}".
- Filtrează `products` client-side după title (cu `expandSearchTerms` din `searchSynonyms.ts` deja existent).
- Dropdown sub input cu Recent / Trending în categorie (top 5 după `created_at`).

### 4. StickyFilterBar (desktop) / FloatingFilterButton (mobil)

Desktop:
- Devine sticky după ce hero-ul iese din viewport (`position: sticky; top: 64px`).
- Stil: `bg-background/80 backdrop-blur-xl border-b border-border/60` cu transition 200ms.
- Layout flex-row cu chips:
  - Quick filter chips (toggle on/off, animated):
    - "Disponibile azi" (filtru pe `get_booked_dates` — degradare: dacă RPC nu acoperă, devine no-op cu tooltip)
    - "Utilizatori verificați" (`profile.kyc_status === 'approved'`)
    - "Instant booking" (placeholder vizual — nu există flag)
    - "Sub 100 RON/zi", "Sub 50 RON/zi"
  - Location chips: "Aproape de mine" (Geolocation API → match `location_city`), "Iași", "București", "Cluj"
  - Sort dropdown (Relevanță / Preț ↑ / Preț ↓ / Cele mai noi)
  - View switcher Grid/List/Hartă (Hartă disabled cu tooltip "În curând")
- Active chip: fundal `primary/15` text `primary` cu ring `primary/30`.

Mobil:
- Filter bar normal sub pills, NU sticky (ar ocupa prea mult).
- **Floating filter button** stânga-jos peste produse: `fixed bottom-20 left-4 z-40` rotund 56px cu icon Filter + badge cu nr filtre active.
- Click → deschide `MobileFilterSheet` (bottom sheet `vaul` Drawer existent).
  - Full-height (90vh), titlu "Filtre", buton X.
  - Secțiuni stack-uite: Subcategorie / Preț slider dual / Locație (Județ + Localitate dropdown) / Rază km (slider 5-100) / Trust filters / Sort.
  - Footer sticky: "Resetează" stânga ghost + "Arată {N} rezultate" primary FAB.
  - Live count update pe măsură ce schimbi filtrele.

### 5. DiscoveryRails (între filter bar și grid, deasupra rezultatelor filtrate)

Apar DOAR când nu există filtre active (mod "browse"):
- Rail 1: "🔥 Trending în {categorie}" — top 6 după `created_at desc` (proxy pentru trending până la analytics real).
- Rail 2: "✨ Noi săptămâna aceasta" — `created_at >= now-7d`.
- Rail 3: "📍 Aproape de tine" — apare dacă userul a aprobat geolocation; match pe oraș.
- Fiecare rail = horizontal swipeable (4 vizibile desktop, 1.5 mobil) cu Embla, identic UX cu `NearbyProductsSlider`.
- Când userul aplică orice filtru, rail-urile dispar (cu fade-out 200ms) și apare grid-ul filtrat.

### 6. Product Grid

- Reuse `ProductCard` existent.
- Adaug overlay opțional (props noi `showBadges?: boolean`, `badge?: 'new' | 'trending'`):
  - "Nou" — chip alb peste imagine pentru produse `< 7 zile`.
  - "Popular" — chip auriu pentru produse cu cel mai mult favorites (dacă disponibil).
- Hover: `hover:-translate-y-1 hover:shadow-xl transition` pe card. Image zoom subtil `group-hover:scale-105` (deja există parțial).
- Loading: 8 skeleton cards (`animate-pulse` cu `bg-muted` + linii placeholder), fade-in stagger via `style={{ animationDelay }}`.
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` cu gap-4 mobile / gap-6 desktop.
- "Load more" buton centrat sub grid cu spinner; client-side slice din 24 → 24 + 24...

### 7. View switcher

- Grid / List (existent) + Hartă disabled.
- Animated active state: pill background morph-uiește între opțiuni (folosind `layoutId` Framer Motion pe un singur element `motion.div` în spatele pill-ului activ). Dacă nu vrem framer aici, fallback la `transition-all` cu `bg-background` shifting.

### 8. EmptyCategoryState

- Ilustrație simplă SVG/lucide în `primary/10` circle (h-16 w-16).
- Titlu: "Nimic pe potriva căutării tale"
- Subtitle bilingual.
- 3 acțiuni:
  - "Resetează filtrele" (primary)
  - "Vezi toate categoriile" (ghost)
  - "Încarcă produse similare" — deschide rail orizontal cu produse din alte subcategorii.

### 9. Mobile-first details

- Hero text: line-height aerisit, padding-x `px-4`.
- Pills: `min-h-11` thumb-friendly.
- Cards: 2-col grid pe mobil cu gap 8px, padding inferior 80px ca să nu fie acoperit de bottom nav + floating filter.
- Toate butoanele primare ≥ 44px înălțime.

### 10. Micro-interactions

- Pills active: `transition-all duration-200`, scale 1.02 + ring on activate.
- Stats counters în hero: count-up de la 0 la valoare reală (300ms) când intră în viewport. Hook nou `useCountUp` (~20 linii).
- Filter chips toggle: ring pulse pe activate (`animate-[ring-pulse_400ms_ease-out]` keyframe nou).
- Skeleton: shimmer linear gradient travelling left→right (existing `.shimmer` class sau adaug în `index.css`).
- Favorite heart pe card: scale-bounce on click (există parțial — păstrăm).
- Hero gradient + ken-burns respectă `prefers-reduced-motion: reduce`.

## Files

Touched / new:
- `src/pages/CategoryDetail.tsx` — rescris (rămâne <300 lines orchestrând componentele).
- `src/components/category/CategoryHero.tsx` — nou.
- `src/components/category/SubcategoryPills.tsx` — nou.
- `src/components/category/CategorySearchBar.tsx` — nou.
- `src/components/category/StickyFilterBar.tsx` — nou.
- `src/components/category/MobileFilterSheet.tsx` — nou.
- `src/components/category/DiscoveryRails.tsx` — nou.
- `src/components/category/EmptyCategoryState.tsx` — nou.
- `src/components/products/ProductCard.tsx` — adaug props opționale `badge` + `showBadges` (non-breaking).
- `src/hooks/useCountUp.ts` — nou (mic).
- `tailwind.config.ts` — keyframes `ken-burns`, `ring-pulse`, `shimmer-pass`.
- `src/index.css` — utility class pentru shimmer dacă e nevoie.

## Technical notes

- Folosesc `useProducts` existent (RPC `search_products` cu sinonime) → adaug filtre client-side: subcategorie, preț, search local, trust toggles, location chips.
- Geolocation: `navigator.geolocation.getCurrentPosition` cu reverse-lookup simplu pe lista `judete` (deja avem `romaniaLocations.ts`) — fără API extern.
- Sticky observer: `IntersectionObserver` pe sentinel sub hero pentru a comuta starea sticky a filter bar-ului (evită jitter cu pure CSS sticky pe tot scroll-ul).
- Bottom sheet: refolosesc `Drawer` (vaul) deja prezent în proiect.
- Embla Carousel: deja folosit în `NearbyProductsSlider` — refolosesc setup-ul.
- Toate textele bilingve via pattern-ul `t("…", "…")` din `useLanguage`.
- Performance: skeleton placeholders + `loading="lazy"` pe imagini de jos. Stats hero memoizate.
- Accessibility: aria-labels pe pills, focus rings vizibile pe interactive, sheet trap focus.
