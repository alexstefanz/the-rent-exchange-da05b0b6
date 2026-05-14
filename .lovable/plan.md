# Plan: "Produsele mele" — tabs + stats simplificat

## 1. Redenumire "Anunțurile mele" → "Produsele mele"
Înlocuiesc label-ul în cele 3 locuri unde apare în navigație (header-ul paginii e deja "Produsele mele"):
- `src/data/uxCopy.ts` → `myListings` devine `{ ro: "Produsele mele", en: "My Products" }`
- `src/components/layout/mobile-drawer/MobileDrawer.tsx` → link `/anunturi`
- `src/components/layout/AccountHubMenu.tsx` → item meniu cont

## 2. Stats bar simplificat (`ListingsStatsBar.tsx`)
Păstrez **doar 4 carduri**, în ordinea cerută:
1. Total
2. Active
3. În verificare
4. Cereri noi

Șterg: Drafturi, Ascunse, Respinse, Câștiguri.

Grid devine `grid-cols-2 sm:grid-cols-4` (fără scroll orizontal pe mobil — încap 2×2).

**Cardurile devin clickabile**: click pe un card setează tab-ul activ corespunzător (Total = `all`, Active = `active`, În verificare = `pending`, Cereri noi = nu filtrează produse, ci redirect la pagina de cereri sau scroll, vezi mai jos). Cardul activ primește `ring-2 ring-primary` + `border-primary`.

## 3. Tabs pentru produse (în `ListingsPage.tsx`)
Adaug un component `<ListingsTabs>` deasupra grilei de produse cu tab-urile:
- **Toate** (badge: total)
- **Active** (badge: active)
- **În verificare** (badge: pending)
- **Ascunse** (badge: hidden) — păstrat doar ca tab, nu ca stat card
- **Respinse** (badge: rejected) — la fel

Tab-ul activ este sincronizat cu `filters.status`. Click pe un stat-card de mai sus selectează tab-ul, click pe tab actualizează `filters.status`. Astfel utilizatorul vede o singură categorie odată.

Elimin selectorul "Status" din `ListingsFilterBar` (devine redundant cu tab-urile) — păstrez Categorie / Oraș / Sortare.

## 4. "Cereri noi"
Cardul "Cereri noi" rămâne ca link/quick-action: la click navighează la `/inchirieri` (rentals owner) cu un filtru pentru cereri pending. Nu este un tab pe pagina de produse — sunt rezervări, nu produse.

## Detalii tehnice
- `ListingsStatsBar` primește un prop nou `activeStatus` și callback `onSelect(status)`.
- `ListingsFilterBar`: scot `StatusSelect` din desktop și sheet mobil; `ListingsStatusFilter` rămâne în types pentru `filters.status`.
- Nu modific RPC `get_owner_listings_stats` — pur și simplu nu mai afișez câmpurile `drafts`, `hidden`, `rejected`, `earnings_total` în statsbar (rămân disponibile pentru badge-urile pe taburi).
- Tab-urile folosesc `Tabs` din `@/components/ui/tabs` pentru consistență.

## Out of scope
- Logica back-end / RPC.
- Pagini de inchirieri / cereri.
