# Faze rămase pentru pagina de produs

Redesign-ul de bază e live (galerie cinematic 1+4, booking card sticky, owner trust, social proof, accordion, rental protection, mobile sticky bar, etc.). Mai jos sunt fazele care ar ridica pagina la nivelul Airbnb/Turo complet.

---

## P1 — Esențiale (recomandat acum)

### 1. QA vizual mobil + desktop
- Verificare 375px / 768px / 1280px / 1920px pe produs real cu poze multiple și produs cu o singură poză
- Verificare fallback când produsul are <5 imagini (carousel) vs ≥5 (grid 1+4)
- Verificare sticky booking card nu se suprapune cu footer
- Verificare mobile sticky bar nu acoperă conținut la scroll

### 2. SEO & Meta tags
- `<title>` dinamic: `{Titlu produs} - {Oraș} | Rentli`
- `<meta description>` din primul paragraf descriere (max 160 char)
- Open Graph: og:title, og:description, og:image (prima poză), og:url canonical
- JSON-LD `Product` schema cu price, availability, aggregateRating, review-uri
- `<link rel="canonical">` pe URL slug-based

### 3. Copy bilingv extins în `uxCopy.ts`
- Texte hardcodate în noile componente (RentalProtection, HowItWorksMini, QuickQuestionsChips, OwnerTrustCard) trebuie mutate în `uxCopy.ts` pentru EN
- Strings tip "Anulare gratuită 48h", "Răspunde în X min", chip-uri quick questions

---

## P2 — Polish premium (high impact, low effort)

### 4. Sticky compact header on scroll (Airbnb-style)
- La scroll sub fold-ul galeriei, apare un mini-header sticky cu: titlu produs + preț/zi + buton "Rezervă"
- Doar desktop, dispare la scroll up rapid
- Implementare: IntersectionObserver pe gallery + Framer Motion slide-down

### 5. Lightbox premium
- Zoom & pan (pinch pe mobile, scroll wheel pe desktop)
- Thumb strip jos pentru navigare rapidă
- Counter + caption opțional
- Swipe gestures pe mobil

### 6. Skeleton loaders premium
- Înlocuire `Loader2` spinner cu skeleton care imită exact layout-ul (gallery skeleton + booking card skeleton + content skeleton)
- Reduce CLS și percepția de loading

### 7. Realtime watchers count
- `watchers_count` din `SocialProofStrip` să fie live via Supabase Realtime pe `favorite_products`
- "X persoane se uită acum" cu pulse animation

---

## P3 — Features avansate (scope mai mare)

### 8. Recently viewed products
- LocalStorage tracking ultime 10 produse vizualizate
- Slider sub "More from owner" cu titlul "Vizualizate recent"

### 9. Comparare produse
- Buton "Compară" pe card → drawer lateral cu max 3 produse
- Tabel side-by-side: preț, locație, rating, owner

### 10. Share dialog îmbogățit
- Înlocuire `navigator.share` cu modal custom: copy link, WhatsApp, Facebook, Email, QR code
- Tracking analytics pe canal

### 11. Report listing & Save to collection
- Buton "Raportează" cu modal (motiv: spam/fake/contact info)
- "Salvează în colecție" în loc de simple favorite (Wishlist multiple)

### 12. Owner verified badge bazat pe KYC tier real
- Acum `ownerVerified={true}` e hardcodat în `PremiumBookingCard`
- Fetch real `kyc_tier` din profil owner și afișare badge "Verificat" doar pentru tier ≥ 2

---

## Recomandare

**Acum:** P1 (1+2+3) — QA + SEO + bilingv. Asigură că ce e deja construit e production-ready.
**Următorul sprint:** P2 (4+5+6) — polish-ul care face diferența vizual.
**Backlog:** P3 — features ce necesită discuții suplimentare de scope și UX.

Spune-mi care prioritate o ataci și o execut într-un task focusat.
