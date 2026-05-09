# Redesign Account Dropdown — Premium Account Hub

## Obiectiv

Înlocuiesc dropdown-ul curent (listă plată din `Navbar.tsx` liniile 196-312) cu un **mini Account Hub** premium care folosește date realtime, are ierarhie vizuală clară și pe mobil devine bottom sheet.

Reutilizez integral hook-ul existent `useAccountDashboard()` care livrează deja realtime: profil, KYC, balance, mesaje necitite, rezervări active, IBAN missing, completare profil.

## Componenta nouă: `AccountHubMenu`

Fișier: `src/components/layout/AccountHubMenu.tsx`

**Trigger** (rămâne în Navbar): avatarul + chevron + dot indicator portocaliu pulse când `signals.unreadMessages + signals.activeRentalsAsRenter + signals.activeRentalsAsOwner > 0` sau KYC/IBAN missing.

**Conținut (de sus în jos):**

### 1. Header card (gradient subtil orange/10 → background)
- Avatar 56px cu inel `ring-2 ring-primary/20` + dot verde online (poll `presence` opțional, V1 doar prezent dacă logat).
- Nume + email truncate.
- Trust row sub email: `<ShieldCheck>` Verificat (sau warning amber dacă KYC pending) · `<Star>` rating · `Membru din <an>`.
- Bara de progres profil (`completion%`) cu label "Profil X% complet" — click → `/contul-meu`.

### 2. Quick Status Bar (grid 2x2, mobile single line scroll)
4 carduri compacte (12px radius, border subtil, hover scale-105):
- **Mesaje** — `unreadMessages` (badge animat pulse dacă > 0) → `/mesaje`
- **Rezervări active** — `activeRentalsAsRenter + activeRentalsAsOwner` → `/rezervari`
- **Balanță** — `availableBalance` RON cu eye toggle (păstrăm `localStorage show_balance`) → `/castiguri`
- **Acțiuni urgente** — count = `actionableHandover + pendingReturns` → `/inchirieri` (apare doar când > 0; altfel slot 4 = "Anunțuri" → `/owner`)

### 3. Primary CTA "Adaugă anunț"
- Full-width, `bg-gradient-to-r from-primary to-[#F98715]`, shadow `shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]`, hover translate-y-[-1px].
- Icon `<PlusCircle>` + text.

### 4. Account Health (compact, doar item-urile incomplete)
- Header mic "Finalizează contul" + count `done/total`.
- Maxim 3 item-uri incomplete vizibile, fiecare row: icon check/warning + label + chevron → href.
- Dacă `completion === 100` secțiunea se ascunde și se înlocuiește cu un mic banner "✓ Cont complet verificat".

### 5. Grouped Navigation
Trei grupuri cu section header (uppercase, 11px, tracking-wider, muted):

**ACTIVITATE**
- Chat (badge unread) · Închirieri (badge active owner) · Rezervări (badge active renter) · Favorite

**CONT**
- Contul meu · Anunțurile mele · Verificare KYC (badge "Pending" amber dacă missing) · Plăți & Retrageri (badge "Add IBAN" dacă missing)

**SUPORT**
- Suport & Tickete

**ADMIN** (doar `isAdmin`)
- Panou Admin (text verde existent)

### 6. Footer
- Language switcher inline + Log out (text destructive).

## Mobile UX

Pe `< lg` (sub 1024px) același conținut se randează într-un **`<Sheet side="bottom">`** (shadcn) cu:
- `max-h-[92dvh]`, scroll intern
- Drag handle vizual sus (bară 36×4 muted)
- CTA "Adaugă anunț" devine **sticky bottom** cu safe-area padding
- Header card sticky top
- Spacing mai generos (py-3.5) pentru thumb reach

Detecție via `useMediaQuery` pe `(min-width: 1024px)` (folosesc hook simplu inline cu `matchMedia`). Trigger e același buton cu avatar.

## Animații & micro-interacții

- Open: `data-[state=open]:animate-fade-in` + slight `slide-in-from-top-2` (radix DropdownMenuContent permite asta cu utility classes).
- Hover items: `transition-colors hover:bg-primary/5 hover:translate-x-0.5`.
- Badge unread: `animate-pulse` doar primul render → după 600ms devine static (clasă removed via setTimeout) ca să nu distragă.
- Skeleton loader pentru status cards când `isLoading` (4 div-uri pulse muted).
- Realtime updates merg automat prin hook-ul deja existent (subscriptions la messages/rentals/notifications/profiles).

## Date & integrare

- Sursă unică: `useAccountDashboard()` (deja realtime).
- `useIsAdmin()` păstrat pentru gating ADMIN.
- Balance toggle: păstrăm `show_balance` din localStorage.
- Bilingv prin `useLanguage().t(ro, en)`.

## Modificări în fișiere

1. **`src/components/layout/AccountHubMenu.tsx`** — componenta nouă (desktop dropdown + mobile sheet, 1 fișier, ~400 linii).
2. **`src/components/layout/Navbar.tsx`** — înlocuiesc blocul `<DropdownMenu>` (liniile ~196-312) cu `<AccountHubMenu />`. Curăț importurile devenite neutilizate.
3. (Opțional) **`src/hooks/useMediaQuery.ts`** — utilitar minor dacă nu există deja.

Nu modific:
- ruta sau routing-ul
- logica DB/backend
- mobile bottom nav (rămâne separat, nu se suprapune; sheet-ul se deschide peste el)

## Verificare

- Desktop ≥1024px: dropdown se deschide cu animație, status cards arată numere reale, badge unread pulse, KYC/IBAN warnings vizibile.
- Mobile <1024px: aceeași componentă deschide bottom sheet cu CTA sticky.
- Realtime: trimit un mesaj din alt cont → badge crește instant (test manual).
- States: loading (skeletons), no profile (fallback la email), KYC complete (banner verde), admin user (vede secțiunea ADMIN).
