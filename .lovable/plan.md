## Obiectiv
Transformare completă a `/produs/:slug` într-o experiență premium de booking, inspirată din Airbnb / Turo / Apple, cu focus pe trust, claritate și conversie. Mobile-first, fără a încărca pagina inutil.

## Layout final (desktop)

```text
┌─────────────────────────────────────────────────────────┐
│ Navbar                                                  │
├─────────────────────────────────────────────────────────┤
│ Breadcrumb · titlu · rating · locație · share/heart     │
├─────────────────────────────────────────────────────────┤
│ ╔════ Cinematic gallery (1 mare + 4 thumbs) ════╗  ┌──┐ │
│ ║                                                ║  │  │ │
│ ╚════════════════════════════════════════════════╝  │ B│ │
│ Free cancellation strip                              │ o│ │
│ Owner Trust Card (premium)                           │ o│ │
│ Quick Questions chips                                │ k│ │
│ Description (accordion)                              │ i│ │
│ Specificații / Accesorii / Reguli (accordion)        │ n│ │
│ Rental Protection (4 carduri)                        │ g│ │
│ Cum funcționează (4 pași)                            │  │ │
│ Locație + map                                         │  │ │
│ Reviews summary + listă                              │  │ │
│ More from this owner · Nearby products               │  │ │
└─────────────────────────────────────────────────────────┘
```

Mobile: gallery full-bleed sus, restul stivuit, **sticky bottom CTA bar** cu preț + "Verifică disponibilitatea". Tap → bottom sheet cu calendar + breakdown.

## Componente noi (`src/components/product/`)

1. **PremiumBookingCard.tsx** — sticky desktop, preț ierarhizat (mare/zi + mic/săpt+lună), calendar range cu hover preview, breakdown live, "Anulare gratuită 48h", trust mini-strip (verificat · răspuns rapid · plată sigură), CTA dual (Rezervă · Întreabă).
2. **MobileStickyBookingBar.tsx** — `fixed bottom-0`, doar mobile, afișează preț + buton "Verifică datele". Deschide `MobileBookingSheet` (Drawer/shadcn Sheet) cu același calendar+breakdown+CTA.
3. **OwnerTrustCard.tsx** — înlocuiește OwnerSection: avatar XL cu dot online, nume + verified badge, rating·rentals·response time·response rate·member since, butoane "Mesaj" + "Vezi profil". Date din nou RPC `get_product_owner_stats`.
4. **QuickQuestionsChips.tsx** — 3-4 chips ("E disponibil azi?", "Include accesorii?", "Livrare?", "Pickup flexibil?"). Click → deschide ChatDialog cu `initialMessage` prefilled (necesită mic prop nou pe ChatDialog).
5. **ProductInfoAccordion.tsx** — wrap shadcn Accordion: Descriere (default open), Specificații, Accesorii incluse, Reguli, Livrare & pickup, Politici. Conținut existent reutilizat.
6. **RentalProtection.tsx** — 4 carduri (Plăți securizate Stripe · Proces verbal digital · Protecție dispute · Suport 7/7) cu iconuri + 1-2 rânduri de copy.
7. **HowItWorksMini.tsx** (în product/) — 4 pași orizontali (Cere → Confirmă → Ridică → Returnează) cu Lucide icons și conector.
8. **PremiumGallery.tsx** — refactor `ProductImageGallery` desktop: layout 1 mare + grid 2x2 thumbs (Airbnb style), buton "Vezi toate (N)" overlay, hover zoom subtil, lightbox cu animații. Mobile rămâne swipe (Embla deja există) + counter.
9. **SocialProofStrip.tsx** — sub titlu: "Închiriat de N ori · Ultima rezervare acum 2 zile · X persoane urmăresc". Date din RPC nou.
10. **ProductReviewsPremium.tsx** — refactor: sumar (rating big + 3 bare progres pe sub-criterii: comunicare, condiție, punctualitate), tag-uri top ("Comunicare excelentă", "Punctual"), grid 2 col cu avatar+rating+verified badge, paginare/load more.
11. **LocationCard.tsx** — wrap map cu titlu, oraș, distanță față de user (geolocation opt-in), notă "Adresa exactă apare după rezervare".

## Backend (1 migration nouă)

**RPC `get_product_extended_stats(p_product_id uuid)`** — SECURITY DEFINER, public:
- `times_rented` — count rentals confirmed/active/completed
- `last_booking_at` — max(confirmed_at)
- `watchers_count` — count favorite_products
- `owner_total_rentals` — count rentals where owner_id = product.owner_id, status completed
- `owner_response_time_minutes` — avg(first message reply latency) din messages join conversations
- `owner_response_rate` — % conversații cu reply / total
- `owner_member_since` — profiles.created_at
- `owner_avg_rating` — avg din product_reviews pe toate produsele owner-ului
- `owner_review_count` — count

Cache 60s în React Query. Hook nou: `src/hooks/queries/useProductExtendedStats.ts`.

**RPC `get_product_review_breakdown(p_product_id uuid)`** — agregat: avg rating, count, avg pe sub-criterii (communication, product_condition, punctuality), top 3 tag-uri (din keyword extract simplu pe comment — sau, mai sigur, omitem tag-urile auto și folosim doar sub-criterii pentru MVP). **Decision:** doar sub-criterii pentru sigure, fără tag-uri (vine în iterație ulterioară).

## Modificări fișiere existente

- `src/pages/ProductDetail.tsx` — restructurat complet pe blocurile de mai sus, păstrăm logica (handlers, calendar, navigare checkout). Devine ~250 linii cu compoziție.
- `src/components/messaging/ChatDialog.tsx` — accept `initialMessage?: string` care pre-completează inputul la deschidere (folosit de QuickQuestions).
- `src/components/product/ProductImageGallery.tsx` — split în PremiumGallery (desktop) + mobile swipe; sau extins cu props `variant="cinematic"`.
- `src/index.css` — adăugat keyframe `shimmer` pentru skeleton loaders.

## Micro-interactions
- `hover:scale-[1.02]` pe carduri trust + protecție.
- `transition-all duration-200` standard.
- Skeleton shimmer pentru booking card înainte de încărcare stats.
- Heart toggle: `animate-scale-in` la favorite.
- CTA primary: subtle `hover:shadow-lg` + `hover:-translate-y-0.5`.
- Reduce-motion: respectat peste tot.

## Mobile-first
- Sticky bottom CTA cu safe-area-inset.
- Toate accordeoanele colapsate by default pe mobil (Descriere parțial deschis cu "Citește mai mult").
- Galerie swipe + counter "3/12" + tap → fullscreen lightbox.
- Spacing thumb-friendly (min 44px tap targets).
- Owner trust collapse on mobile cu mini-row + "Vezi detalii".

## Bilingv
Toate copy-urile noi adăugate în `src/data/uxCopy.ts` sub `productDetail.*` (RO + EN).

## Out of scope (clar)
- "Compare" feature (link la favorite există deja).
- "Recently viewed" persistent (skip — necesită schimbări mai mari).
- Push real-time pe watchers count (folosim doar query la mount, fără realtime).
- Tag-uri auto din review-uri (skip — neclar fără NLP).

## Riscuri & mitigare
- **Performanță:** RPC-urile noi rulează 1x la mount. Indexele există deja pe `rentals(product_id, status)` și `favorite_products(product_id)`.
- **RLS:** RPC-urile sunt SECURITY DEFINER, returnează doar agregate, nu expun date sensibile.
- **QA vizual:** verificăm 375 / 768 / 1280 după implementare; sticky bar nu trebuie să acopere conținut (padding-bottom pe `<main>` mobil).
