# Igienă SEO heading-uri — pagina produs + componente partajate

## Probleme identificate

Pe `/produs/:slug` apar în DOM mai multe heading-uri greșite:

1. **H3 „Categorii populare"** — provine din `DrawerCategoryExplorer.tsx` (drawer mobil), renderat în DOM chiar și când e închis.
2. **2× H1 cu titlul produsului** — în `ProductDetail.tsx` titlul este renderat de două ori (bloc desktop `lg:flex` + bloc mobil `lg:hidden`), ambele ca `<h1>`. Deși unul e ascuns vizual, ambele există în DOM.
3. **H1 suplimentar în BookingCard** — `src/components/product/BookingCard.tsx` are 2× `<h1>` cu titlul (mobil + desktop intern).
4. **H2 duplicat cu titlul** — `StickyProductHeader.tsx` are `<h2>` cu titlul produsului (apare la scroll, dar e în DOM).
5. **Numele proprietarului ca H3** — `OwnerTrustCard.tsx` folosește `<h3>` pentru numele owner-ului; ar trebui `<p>`/`<span>`.

## Modificări propuse

### 1. `src/pages/ProductDetail.tsx`
Un singur `<h1>` cu clase responsive (`text-2xl lg:text-3xl`), fără a duplica blocul. Restructurăm cele două blocuri (mobil/desktop) astfel încât titlul + locația + social proof să apară o singură dată, cu layout-ul gestionat prin Tailwind responsive — nu prin două `<h1>` separate.

### 2. `src/components/product/BookingCard.tsx`
Schimbăm cele două `<h1>` cu titlul în `<p className="font-heading ...">` sau `<span>` — BookingCard nu trebuie să dețină H1-ul paginii.

### 3. `src/components/product/StickyProductHeader.tsx`
`<h2>` → `<span>` / `<p>` (este un header sticky vizual, nu un titlu semantic de secțiune).

### 4. `src/components/product/OwnerTrustCard.tsx`
`<h3>` cu numele owner-ului → `<p className="font-heading ...">` (păstrăm stilurile identice).

### 5. `src/components/layout/mobile-drawer/DrawerCategoryExplorer.tsx`
`<h3>Categorii populare</h3>` → `<p>` / `<div>` cu aceleași clase. Este o etichetă vizuală în drawer, nu un titlu de pagină.

### 6. Audit rapid restul componentelor de pe pagina produs
- `ProductInfoAccordion`, `LocationCard`, `RentalProtection`, `RecentlyViewedSlider`, `ProductIncludes`, `UsageRules`, `HowItWorksMini` folosesc `<h2>` pentru titluri reale de secțiune — **se păstrează** (corect SEO sub un singur H1).
- `OwnerOtherListings`, `PremiumBookingCard` au `<h3>` sub `<h2>` — corect, se păstrează.

### 7. Verificare globală (alte pagini cheie)
Confirm rapid în `Index.tsx`, `CategoryDetail.tsx`, `Search.tsx`, `ListingsPage.tsx`, `UserProfile.tsx` că:
- există un singur `<h1>` per pagină;
- nu există heading-uri în Navbar / Footer / drawer-uri care să apară înainte de H1.

Dacă găsesc abateri identice (ex. drawer / sticky header cu `<h2>` în alte locuri), le corectez în aceeași sesiune.

## Detalii tehnice
- Schimbările sunt strict semantice (tag swap) — clasele Tailwind rămân identice, deci aspectul vizual nu se modifică.
- Nu se modifică logică de business, rute sau date.
- Nu se modifică `useSEO` / meta tags (deja corecte per pagină produs).

## Out of scope
- Nu modific conținutul textual al titlurilor.
- Nu modific structura paginilor admin sau a paginilor legale.
