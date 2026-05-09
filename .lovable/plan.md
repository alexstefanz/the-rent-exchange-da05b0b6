## Obiectiv
Refacere completă a homepage-ului `/` într-un mini Account Hub-style premium marketplace: hero dinamic, search smart, trust bar realtime, categorii interactive, product cards Airbnb-grade, social proof live, secțiuni "De ce Rentli" + "Cum funcționează", footer reproiectat. Mobile-first, micro-interactions discrete, fără bloat.

## Asset-uri noi (4 imagini hero)
Generăm cu `imagegen` (premium, fotografie realistă — fără AI vibe), rezoluție 1920x1080, salvate în `public/images/hero/`:
- `hero-outdoor.webp` — cort montan în răsărit, echipament outdoor
- `hero-events.webp` — boxe profesionale + lumini scena la un eveniment
- `hero-travel.webp` — portbagaj cu valize/role + vehicul electric
- `hero-tools.webp` — atelier cu unelte profesionale (drujbă, bormașină)

Banner-ul existent `banner_hero.webp` rămâne ca slide #1 (electronice/general). Fiecare slide are propriul label tradus în RO/EN și keyword-ul pentru search rapid.

## Backend — 1 RPC nou
Migrare nouă: `get_homepage_activity()` (SECURITY DEFINER, public) returnează JSON:
- `recent_rentals`: ultimele 5 rentals cu `status IN ('confirmed','active','completed')` din ultimele 7 zile, cu `product_title`, `product_image`, `city`, `time_ago_seconds` (nu expune `renter_id` sau preț)
- `totals`: `verified_users` (profiles cu `kyc_status='VERIFIED'`), `avg_rating` (medie din `product_reviews`), `total_reviews`, `total_active_products`
- Cache pe client 60s; realtime channel pe `rentals` (insert/update) face `invalidate`

## Componente noi (`src/components/home/`)
1. **HeroDynamic.tsx** — slideshow 5 background-uri cu crossfade 800ms + slow zoom (CSS `@keyframes hero-zoom 14s ease-in-out infinite alternate`), gradient overlay `from-black/65 via-black/35 to-transparent`, parallax discret doar desktop. Indicator dots jos. Auto-rotate 6s, pauză la hover. Titlul + chip-ul de categorie schimbă sincron cu slide-ul. Respectă `prefers-reduced-motion`.
2. **SmartSearch.tsx** — înlocuiește `HeroSearchForm` în hero. Input cu:
   - Trending chips sub bar: 6 keyword-uri hard-coded localizate (TV OLED, Cort camping, Boxă portabilă, etc.) — click → navighează `/cauta?q=...`
   - Recent searches din `localStorage` (`rentli_recent_searches`, max 5, dedup)
   - Suggestions live cu debounce 200ms via `products` (`title ILIKE %q% LIMIT 6`), afișate în `Popover` ancorat la input
   - Selector județ/localitate compact, glass dropdown
   - Sticky pe mobil sub Navbar la scroll past hero (IntersectionObserver pe hero), cu animație `slide-down`
3. **TrustBarPremium.tsx** — înlocuiește USP bar portocaliu. Fundal `bg-card/80 backdrop-blur` cu 4 carduri glass (icon mare 36px + counter realtime din RPC + label):
   - `1,200+ utilizatori verificați` (din `totals.verified_users`, animat cu count-up la mount)
   - `4.9★ rating mediu` (din `totals.avg_rating`)
   - `Plăți securizate Stripe`
   - `Suport 7 zile/săpt.`
4. **CategoriesInteractive.tsx** — înlocuiește grid-ul actual. Desktop: 6 coloane × 2 rânduri cu hover elevation `-translate-y-1.5` + shadow primary glow + icon pulse 1×. Mobil: scroll orizontal `snap-x snap-mandatory` cu carduri 140px, indicator dots jos.
5. **ProductCardPremium.tsx** — refacere `ProductCard` păstrând API-ul. Adaugă:
   - Imagine cu `group-hover:scale-105 duration-500`, gradient overlay subtil sus
   - Heart button cu `scale-125 + heart-fill` animație la favorite
   - Badge "Verificat" cu `ShieldCheck` dacă owner.kyc_status=VERIFIED
   - Mini-rating: `⭐ 4.9 (12) · răspunde în 1h`
   - Preț prominent (`text-xl font-bold`) + `/zi` mic, separator subtil
   - Skeleton loader matching pentru `FeaturedListings`
6. **SocialProofLive.tsx** — bar slim între categorii și featured cu chip-uri rotative (3s) "🟢 Cort camping închiriat acum 2h în Cluj" etc., din `recent_rentals`. Realtime via Supabase channel.
7. **WhyRentli.tsx** — secțiune 5 carduri (mai ieftin, produse verificate, proces verbal digital, suport dedicat, plăți securizate) — icon + titlu + 1 linie. Stagger fade-in la scroll (IntersectionObserver).
8. **HowItWorksMini.tsx** — 3 pași simpli (Caută → Trimite cerere → Ridică) cu iconuri Lucide mari, conector linie subtilă punctată între ele desktop. Pe mobil stack vertical.
9. **FooterPremium.tsx** — refacere `Footer`:
   - 4 coloane (Despre, Suport, Legal, Comunitate) + bandă newsletter sus cu `Input` + buton "Abonează-te" (mailto deocamdată, în line cu writing-policy memory)
   - Trust badges: SSL/Stripe/ANPC/SOL — iconuri inline
   - Social: Facebook/Instagram/TikTok cu hover scale
   - Linie de jos: "© 2026 Rentli · România" + selector limbă

## Modificări `src/pages/Index.tsx`
- Eliminat parallax JS în favoarea CSS-only animation
- Înlocuit hero-ul + USP-ul + categoriile + featured + CTA cu noile componente
- Ordine secțiuni: `HeroDynamic + SmartSearch` → `TrustBarPremium` → `CategoriesInteractive` → `SocialProofLive` → `FeaturedListings` (refactor cu ProductCardPremium) → `WhyRentli` → `HowItWorksMini` → CTA banner (păstrat, refinat) → `FooterPremium`
- Wrap toate secțiunile cu `Suspense` lazy unde dincolo de prima viewport

## Hook nou
`src/hooks/useHomepageActivity.ts` — wrap RPC cu React Query (staleTime 60s) + Supabase realtime channel pe `rentals` care face `queryClient.invalidateQueries`.

## Micro-interactions
- Folosim animațiile Tailwind existente (`animate-fade-in`, `animate-scale-in`, `hover-scale`)
- Stagger via `style={{ animationDelay }}` pe map-uri (50ms increments)
- Toate animațiile respectă `@media (prefers-reduced-motion: reduce)`

## Mobile-first
- Hero `min-h-[80svh]` cu padding pentru notch
- Search sticky on-scroll mobil
- Categorii horizontal swipe
- Product cards 1.5 coloane pe mobil (peek next card)
- Bottom CTA "Adaugă anunț" rămâne pe mobile (componenta existentă `BottomNav` neschimbată)

## Performanță
- 4 imagini hero noi cu `loading="lazy"` exceptând slide-ul activ; `fetchPriority="high"` doar pe primul
- Componentele sub fold (`WhyRentli`, `HowItWorksMini`, `FooterPremium`, `SocialProofLive`) lazy-loaded cu `React.lazy`
- RPC `get_homepage_activity` cachează 60s pe client, realtime invalidate doar la rentals noi

## Out of scope (faza viitoare)
- Personalizare bazată pe user logat (recently viewed, recommended for you) — pregătim hook-uri stub `useRecentlyViewed`, dar randăm condiționat doar dacă există date
- Newsletter real (acum mailto)
- App badges Coming Soon (placeholder)

## Risc & verificare
- Vizual QA pe viewport-urile 375, 768, 1280, 2186 după implementare
- Verificăm că noul RPC nu sparge RLS (rulăm `linter` după migrație)
- Lighthouse: target LCP < 2.5s — verificăm că hero păstrează un singur `fetchPriority="high"`
