# Redesign Mobile Drawer Premium

Transform actualul mobile menu (`Navbar.tsx`, ~240 linii inline) într-o experiență mobile-first premium, modulară, cu feel de aplicație nativă.

## Arhitectură nouă

Extragem totul din `Navbar.tsx` într-un nou folder `src/components/layout/mobile-drawer/`:

```text
mobile-drawer/
├── MobileDrawer.tsx              ← shell (overlay + panel + swipe-to-close + body-scroll lock)
├── DrawerProfileHero.tsx         ← avatar, nume, email, KYC badge, quick stats
├── DrawerQuickActions.tsx        ← 4 large touch cards (Adaugă, Mesaje, Rezervări, Câștiguri)
├── DrawerContextualStatus.tsx    ← banner-uri smart (rezervare activă, KYC pending, balanță)
├── DrawerSearch.tsx              ← input search rapid (produse/categorii/rezervări/mesaje)
├── DrawerNavGroup.tsx            ← reusable section: header + items + active state
├── DrawerCategoryExplorer.tsx    ← chips populare + "Vezi toate" → /categorii
├── DrawerAccountHealth.tsx       ← checklist email/telefon/plată/KYC
├── DrawerSupportMini.tsx         ← ticket activ + AI assistant entry
└── DrawerFloatingCTA.tsx         ← sticky "Adaugă produs" jos
```

`Navbar.tsx` păstrează doar butonul hamburger și randează `<MobileDrawer open={...} onClose={...} />`. Tot blocul `{/* Off-canvas Mobile Menu */}` (linii ~232–470) este eliminat.

## Layout drawer (de sus în jos)

```text
┌─────────────────────────────────┐
│ [logo]              [X]         │ ← header sticky, blur backdrop
├─────────────────────────────────┤
│ ╭───────────────────────────╮   │
│ │ Avatar  Alex Test         │   │ ← Profile Hero (gradient subtil)
│ │         alex@mail.com     │   │
│ │         ✓ Verificat       │   │
│ │         2 rez. active     │   │
│ ╰───────────────────────────╯   │
│                                 │
│ [+Adaugă][Mesaje•3]             │ ← Quick Actions grid 2×2
│ [Rezervări][Câștiguri]          │
│                                 │
│ ⚠ KYC pending → Verifică        │ ← Contextual status (doar dacă e cazul)
│                                 │
│ 🔍 Caută orice...               │ ← Search
│                                 │
│ ── ACTIVITATE ──                │ ← Grouped nav
│  Mesaje • Rezervări • Închirieri│
│  Favorite                       │
│                                 │
│ ── CONT ──                      │
│  Contul meu • Anunțurile mele   │
│  Verificare KYC • Plăți         │
│                                 │
│ ── CATEGORII ──                 │
│  [chip][chip][chip][chip]       │ ← top 6 populare
│  → Vezi toate categoriile       │
│                                 │
│ ── ACCOUNT HEALTH ──            │
│  ✓ Email  ✓ Telefon  ⚠ IBAN     │
│                                 │
│ ── SUPORT ──                    │
│  Ticket #TCK-001 • AI Assistant │
│                                 │
│ ── ADMIN ── (doar admin)        │
│  Panou Admin                    │
│                                 │
│ Limbă: RO/EN    [Logout]        │
└─────────────────────────────────┘
│ [+ Adaugă produs] floating CTA  │ ← sticky bottom (safe-area)
└─────────────────────────────────┘
```

## Componente — detalii

### MobileDrawer (shell)
- Width `min(88vw, 360px)`, h-full, `bg-background/95 backdrop-blur-xl`
- Overlay `bg-black/60 backdrop-blur-sm`, fade 250ms
- Panel: spring slide cu `transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]`
- Swipe-to-close: `onTouchStart/Move/End` — dacă `deltaX < -60px` → close
- Body scroll lock + `momentum scrolling` (`-webkit-overflow-scrolling: touch`)
- Stagger animation pe secțiuni (`animate-fade-in` cu delay incremental 40ms)

### DrawerProfileHero
- Card cu `bg-gradient-to-br from-primary/10 via-background to-primary/5`, border subtle, rounded-2xl
- Avatar 56px cu ring + KYC `ShieldCheck` overlay dacă verificat
- Nume + email truncate, badge "✓ Identitate verificată" sau "⚠ Neverificat"
- Quick stats inline: `2 rezervări active • ★ 4.9`
- Click → `/contul-meu`

### DrawerQuickActions
- Grid 2×2, fiecare card: `aspect-[1.6] rounded-2xl bg-card border hover:border-primary/40`
- Icon 24px în cerc `bg-primary/10`, label sub, badge realtime în colț (mesaje necitite, etc.)
- Touch target ≥ 64px

### DrawerContextualStatus
- Apare doar dacă există signal: rezervare în curs, KYC pending, balanță retrăgătoare, ticket nou
- Card slim cu icon stâng + text + CTA arrow → link contextual

### DrawerSearch
- Input cu `Search` icon, `rounded-xl`, on submit → `/cauta?q=...`
- Faza 1: doar redirect (nu inline results) — keeps drawer rapid

### DrawerNavGroup
- Header: `text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2`
- Items: `flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/8 active:scale-[.98]`
- Suport `badge` + `active` (NavLink) state cu `bg-primary/10 text-primary`

### DrawerCategoryExplorer
- 6 chip-uri populare (din `categories` slice 0..6) cu icon
- Buton "Vezi toate categoriile" → `/categorii` (route existent)
- ELIMINĂ accordion-ul actual cu toate subcategoriile (cauza principală a "drawer prea lung")

### DrawerAccountHealth
- Listă compactă 3 itemi: email, telefon, IBAN
- Status `Check` (verde) sau `AlertCircle` (warning) + CTA inline pentru completare

### DrawerSupportMini
- Dacă `ops_tickets` open există → arată `TCK-XXXXXX` + status
- Link "AI Assistant" → `/suport`

### DrawerFloatingCTA
- Sticky bottom inside drawer, `pb-[env(safe-area-inset-bottom)]`
- Buton primary fullwidth "Adaugă produs" cu `Plus` icon

## Date & hooks

Folosește hookuri existente — fără modificări DB:
- `useCurrentUserProfile` (kyc_status, full_name, avatar)
- `useConversations` (unread badge)
- `useQuery` balance (deja în Navbar — îl mutăm în drawer)
- Nou hook `useDrawerStats(userId)` în `src/hooks/queries/`:
  - count rentals active (`status in ('confirmed','in_progress')` ca renter+owner)
  - count tickets open (`ops_tickets.status='NEW'/'OPEN'`)
  - returnează `{ activeRentals, openTickets, kycPending }`
  - Single query batched, `staleTime: 60_000`

## Design tokens

- Toate culorile prin tokens (`bg-primary`, `text-foreground`, etc.) — fără hardcoded
- Border radius: `rounded-2xl` (16px) pentru carduri, `rounded-xl` pentru items
- Spacing: `p-4` container, `gap-3` între secțiuni, `gap-1` între items
- Shadows: `shadow-2xl` pe panel, `shadow-sm` pe quick action cards
- Animations: `animate-fade-in`, `animate-scale-in`, custom stagger via inline `style={{animationDelay}}`

## Bilingv

Toate stringurile prin `t("RO", "EN")` — pattern-ul existent.

## Cleanup în Navbar.tsx

- Șterge `expandedMobileCategory`, `toggleMobileCategory`, `closeMobileMenu` body
- Șterge tot blocul JSX al drawer-ului vechi
- Păstrează `isMobileMenuOpen` state, butonul hamburger, body scroll lock se mută în `MobileDrawer`
- Net: Navbar.tsx scade de la 473 → ~250 linii

## Out of scope (faze ulterioare dacă vrei)

- Inline search results în drawer (faza 2)
- Full-page Category Explorer redesign (există deja `/categorii`)
- Push notifications real-time în quick actions badges (deja realtime via React Query invalidation)
