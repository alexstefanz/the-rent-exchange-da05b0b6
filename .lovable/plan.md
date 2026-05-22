## Obiectiv

Site-ul se simte lent la navigare (click pe produs, „Închirierile mele" etc.) chiar dacă datele se încarcă rapid. Cauza principală nu e backendul, ci:

1. **Suspense „blank + spinner"** pe schimbarea de rută → 200–500ms ecran gol.
2. **Query-uri secvențiale** în loc de paralele pe paginile cu mai multe surse de date.
3. **Zero prefetch** la hover/intent — așteptăm clickul ca să începem fetch-ul produsului.
4. **QueryClient fără defaults** (`staleTime: 0`) → refetch la fiecare montare, deși datele sunt deja în cache.
5. **ProductDetail** încarcă eager toate secțiunile (Reviews, RecentlyViewed, NearbyProducts, OwnerOtherListings, Lightbox, ShareDialog) — bundle mare.

## Plan (doar frontend/perf, fără modificări la business logic)

### 1. Defaults globale React Query (`src/App.tsx`)
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 1 min — evită refetch la fiecare navigare
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false, // deja implicit, dar explicit
      retry: 1,
    },
  },
})
```
Impact: revenirea pe o pagină deja vizitată e instant (cache reused), nu mai vedem spinnere.

### 2. Suspense fallback „neinvaziv"
Înlocuim spinner-ul full-screen din `<Suspense>` cu un fallback transparent care păstrează Navbar-ul (deja randat în fiecare pagină nu ar ajuta). Soluție: o bară subțire de progres în top (NProgress-style cu `useNavigation`-like via `useLocation`) — nu pagină goală.

### 3. Prefetch la hover pe link-uri principale
- Helper `usePrefetchProduct(slug)` și `usePrefetchRentals()` care declanșează `queryClient.prefetchQuery(...)` + `import("./pages/ProductDetail")` la `onMouseEnter`/`onFocus`/`onTouchStart` pe:
  - cardurile de produs (`FeaturedListings`, `NearbyProductsSlider`, `ProductCard`, „Vizualizate recent")
  - link-urile din `MobileBottomNav` și `AccountHubMenu` ( „Închirierile mele", „Anunțurile mele", „Mesaje").
- Astfel, până când user-ul dă click, chunk-ul JS + datele sunt deja descărcate → tranziție „instant".

### 4. ProductDetail — paralelizare & lazy below-the-fold
- Înlocuim `useEffect` cu fetch secvențial (`getProductBySlug` → apoi `get_product_owner_public_info` → apoi `isProductFavorite`) cu un `useQuery` care face `Promise.all([owner, favorite])` după ce avem produsul.
- Lazy-load (cu `React.lazy` + `Suspense` cu skeleton local) pentru secțiunile care nu sunt în viewport-ul inițial: `ProductReviewsSection`, `OwnerOtherListings`, `NearbyProductsSlider`, `RecentlyViewedSlider`, `PremiumLightbox`, `ShareDialog`.
- Rezultat: bundle inițial al paginii produs scade semnificativ, LCP mai rapid.

### 5. RentalsPage — skeleton + paralelizare
- `RentalsPage.tsx`: înlocuim spinner-ul de auth cu render imediat al headerului + skeleton pentru `RentalsTab` (re-folosim `DashboardSkeleton` sau cream `RentalsSkeleton`). Nu mai așteptăm `loading` ca să arătăm ceva.
- `fetchMyRentals` în `RentalsTab.tsx`: rulează cele 3 query-uri (rentals → profiles + pv_documents) în paralel cu `Promise.all` după primul, în loc de sequential.
- Adăugăm `placeholderData: keepPreviousData` ca să nu fâlfâie lista la re-fetch.

### 6. Micro-fixes
- `ScrollToTop` folosește `instant` (deja confirmat în memorie) — verificăm că nu blochează randarea.
- Adăugăm `<link rel="prefetch">` în `index.html` pentru chunk-urile `ProductDetail` și `Search` (cele mai vizitate după Home).
- `useGlobalRealtime` — verificăm că nu re-subscribe la fiecare schimbare de rută.

## Detalii tehnice

Fișiere atinse (estimat):
- `src/App.tsx` — QueryClient defaults + fallback subțire
- `src/pages/ProductDetail.tsx` — refactor fetch + lazy children
- `src/pages/RentalsPage.tsx` — skeleton imediat
- `src/components/dashboard/RentalsTab.tsx` — paralelizare query + keepPreviousData
- `src/hooks/usePrefetch.ts` (nou) — helper hover-prefetch
- `src/components/home/FeaturedListings.tsx`, `src/components/products/NearbyProductsSlider.tsx`, `src/components/products/ProductCard.tsx`, `src/components/layout/MobileBottomNav.tsx`, `src/components/layout/AccountHubMenu.tsx` — wire onMouseEnter prefetch
- `index.html` — `<link rel="prefetch">` minim
- `src/components/dashboard/RentalsSkeleton.tsx` (nou, mic)

Nicio modificare la backend, RLS, edge functions sau logica de business. Toate modificările sunt UI/perf.

## Ce NU schimbăm

- Nu atingem auth flow, RLS, Stripe, mesagerie, KYC.
- Nu schimbăm aspectul vizual (doar adăugăm skeletoane care arată ca cardurile reale).
- Nu introducem dependențe noi.

## Validare după implementare

1. DevTools Network → click produs din home: chunk + RPC pornesc la hover, nu la click.
2. Navigare Home → Rentals → Home → Rentals: a doua oară instant (cache).
3. Lighthouse / `browser--performance_profile` pe pagina produs: TBT și LCP în scădere.
