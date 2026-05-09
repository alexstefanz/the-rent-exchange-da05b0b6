# Redesign "Contul Meu" — Premium Account Hub

Transformăm pagina `/profile` (azi: titlu + BalanceCard + 5 butoane portocalii identice) într-un dashboard contextual inspirat din Airbnb Host, Revolut Home, Stripe Express și Uber Driver, păstrând stack-ul existent (React + Tailwind + shadcn + design tokens Rentli).

## Structura nouă a paginii

```text
┌──────────────────────────────────────────────────────────────┐
│  HERO ACCOUNT CARD (gradient subtil, full width)             │
│  Avatar · Nume · Verificat · Rating · Închirieri · Member    │
│  Progress bar "Profil completat 80%" · CTA Completează       │
├──────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS (1 primary + 4 secondary)                     │
│  [+ Adaugă produs] (orange)  · Rezervări · Mesaje · etc.     │
├───────────────────────────────┬──────────────────────────────┤
│  SMART CARDS (contextual)     │  ACCOUNT HEALTH              │
│  - 1 închiriere activă        │  Email · Telefon · KYC ·     │
│  - 2 mesaje necitite          │  IBAN · Profil               │
│  - 500 RON disponibili        │  Progress 4/5                │
│  - Review nou primit          │                              │
├───────────────────────────────┼──────────────────────────────┤
│  ACTIVITY FEED (realtime)     │  NOTIFICATION CENTER         │
│  ultimele 8 evenimente        │  grupate pe tip + badges     │
└───────────────────────────────┴──────────────────────────────┘
              NAV GROUPS: Activitate · Cont · Suport
```

Mobile: o singură coloană, sticky Quick Actions sub Hero, smart cards swipeable, restul stacked.

## Componente noi (`src/components/profile/dashboard/`)

- `AccountHeroCard.tsx` — avatar + nume + chip-uri trust (verificat, rating, închirieri, member since), progress bar completare profil cu CTA `Completează profilul` și link `Vezi profil public`. Gradient `--primary/5` peste `--background`, shadow elegant, fade-in.
- `QuickActions.tsx` — grid: 1 acțiune primară `Adaugă produs` (gradient orange, mai mare) + 4 acțiuni neutre (icon-only stil Revolut: Rezervări, Închirieri, Mesaje, Câștiguri). Doar primary e portocaliu — restul `bg-card border` cu hover discret.
- `SmartCards.tsx` + `SmartCard.tsx` — cardurile apar **doar dacă sunt relevante** (active rentals, unread messages, available balance, new reviews, pending KYC). Fiecare card: icon, titlu, sub-text dinamic, CTA contextual ("Confirmă returul", "Vezi conversațiile", "Retrage bani"). Empty state premium când nu e nimic.
- `AccountHealth.tsx` — checklist 5 itemi (Email, Telefon, KYC, IBAN, Profil complet) cu iconițe verde/gri și progress bar agregat. CTA per item lipsă.
- `ActivityFeed.tsx` — listă cronologică cu icon colorat per tip (booking, review, payout, message), timestamp relativ ("acum 2h"), realtime via Supabase channel.
- `NotificationCenter.tsx` — preluat din `notifications`, grupat pe categorie cu badge count, link "Vezi toate".
- `NavGroups.tsx` — 3 secțiuni colapsabile (Activitate / Cont / Suport) cu link-uri ușoare, fără gradient orange.

## Hooks & date

`src/hooks/useAccountDashboard.ts` — un singur hook care returnează:
- `profileCompletion` (calculat din: avatar, full_name, phone, iban, kyc_status, account_holder_name)
- `trustStats` (rating mediu user reviews, total rentals completate, member since)
- `smartSignals` (active rentals count + next action, unread messages, available balance reuse `useEarnings`, new reviews în ultimele 7 zile, KYC pending)
- `activity` (ultimele 8 din `notifications` + agregare opțională `rentals`/`product_reviews`)

Realtime: subscribe la `notifications`, `messages`, `rentals` pentru utilizator (reuse pattern din `useProfileRealtime`).

## Refactor `src/pages/Profile.tsx`

- Devine orchestrator slim (~80 linii): Navbar + grid 2-col desktop / 1-col mobile cu noile componente.
- BalanceCard actual rămâne folosit doar în `/castiguri` (eliminat din această pagină — info-ul apare în Smart Card "Câștiguri disponibile" + Quick Action).
- Se păstrează redirect-ul către `/auth` pentru utilizatori neautentificați și skeleton loaders pentru fiecare secțiune.

## Design system

- Folosim exclusiv tokeni semantici (`bg-card`, `text-foreground`, `border-border`, `--primary`, `--muted`).
- Orange (`#F59E0B` / `#F98715`) doar pe: CTA Hero "Completează", Quick Action primară "Adaugă produs", smart card cu cea mai urgentă acțiune.
- Border radius 12px (consistent cu memoria), shadow-uri subtile, `animate-fade-in`/`hover-scale` pentru micro-interacțiuni.
- Plus Jakarta Sans (deja default), iconițe `lucide-react`.
- Bilingual via `useLanguage` (RO/EN) pentru toate textele noi.

## Fișiere

Create:
- `src/components/profile/dashboard/AccountHeroCard.tsx`
- `src/components/profile/dashboard/QuickActions.tsx`
- `src/components/profile/dashboard/SmartCards.tsx`
- `src/components/profile/dashboard/SmartCard.tsx`
- `src/components/profile/dashboard/AccountHealth.tsx`
- `src/components/profile/dashboard/ActivityFeed.tsx`
- `src/components/profile/dashboard/NotificationCenter.tsx`
- `src/components/profile/dashboard/NavGroups.tsx`
- `src/components/profile/dashboard/DashboardSkeleton.tsx`
- `src/hooks/useAccountDashboard.ts`

Edit:
- `src/pages/Profile.tsx` (rescris ca orchestrator)

## Out of scope (explicit)

- Fără modificări la backend / RLS / migrări noi.
- Fără redesign la `/contul-meu` (AccountTab — deja făcut), `/castiguri` (deja făcut), `/mesaje`, `/rezervari`.
- Fără sidebar global nou — păstrăm Navbar + MobileBottomNav existente.
- Fără modificări la BalanceCard (rămâne disponibil pentru alte pagini).
