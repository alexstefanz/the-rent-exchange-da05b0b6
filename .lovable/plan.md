# Mobile drawer: aceleași secțiuni ca pe desktop + categorii

Vreau ca off-canvas-ul de mobil (`MobileDrawer.tsx` — drawer-ul lateral care se deschide de la hamburger) să afișeze aceleași secțiuni de cont ca dropdown-ul `AccountHubMenu` de pe desktop: header card cu profil + completare, CTA "Adaugă anunț" (+ Admin Panel), card "Produsele mele", card "Închirieri", card balanță cu IBAN, "Finalizează contul", "Suport & Tickete". Singura adăugare față de desktop: păstrăm secțiunea cu **categorii** (`DrawerCategoryExplorer`).

## Modificări

### 1. `src/components/layout/AccountHubMenu.tsx` — extragere conținut reutilizabil

Extrag JSX-ul `TopZone` + `MiddleZone` într-o componentă nouă exportată `AccountHubBody` în același fișier:

```tsx
export function AccountHubBody({ onNavigate }: { onNavigate: (path: string) => void })
```

Componenta consumă în interior `useAccountDashboard`, `useAuth`, `useIsAdmin`, `useIsBanned`, `useDrawerStats`, `useLanguage` (exact ca acum) și randează:
- `BannedBanner`
- `HeaderCard` (cu progres profil)
- buton "Adaugă anunț" + opțional "Panou Admin"
- card "Produsele mele" → `/anunturi`
- card "Închirieri" → `/rezervari` (afișat doar dacă există activ sau istoric — exact ca acum)
- card balanță RON + IBAN
- "Finalizează contul" (dacă există itemi incompleți)
- card "Suport & Tickete" cu badge tickete deschise

`AccountHubMenu` îl folosește atât pe desktop cât și pe mobile sheet în loc de TopZone+MiddleZone duplicate.

### 2. `src/components/layout/mobile-drawer/MobileDrawer.tsx` — refactor conținut

În body-ul scrollabil înlocuiesc secțiunile actuale:
- ❌ `DrawerProfileHero`
- ❌ `DrawerQuickActions`
- ❌ `DrawerKycPill`
- ❌ `DrawerAccountHealth`
- ❌ rândul CTA "Adaugă anunț + Admin"
- ❌ `accountItems` nav group (KYC)
- ❌ link separat "Suport & Tickete" din partea de jos

cu:
- ✅ `<AccountHubBody onNavigate={onClose} />`
- ✅ `<DrawerCategoryExplorer onNavigate={onClose} />` (păstrat, sub conținutul de cont)

Footer-ul existent rămâne neschimbat: comutator RO/EN + buton "Deconectare" (sau "Autentificare" dacă neautentificat). Header-ul drawer-ului (logo + RO/EN + X) rămâne neschimbat.

Pentru utilizatorii neautentificați (`!user`) afișez doar `DrawerCategoryExplorer` (skip `AccountHubBody`, care presupune profil logat).

### 3. Curățare imports neutilizate

Scot din `MobileDrawer.tsx` importurile `DrawerProfileHero`, `DrawerQuickActions`, `DrawerKycPill`, `DrawerAccountHealth`, `DrawerNavGroup`, `useCurrentUserProfile`, `useAccountDashboard`, `useDrawerStats` (acum gestionate intern de `AccountHubBody`), plus iconițele nefolosite (`PlusCircle`, `Shield`, `LifeBuoy`, `ShieldCheck`, `User`).

Fișierele componente `DrawerProfileHero.tsx`, `DrawerQuickActions.tsx`, `DrawerKycPill.tsx`, `DrawerAccountHealth.tsx`, `DrawerNavGroup.tsx` rămân pe disk (nemai-folosite) — nu le șterg în acest plan ca să rămână fix și minimal. Pot fi curățate ulterior dacă vrei.

## Rezultat vizual mobile drawer (de sus în jos)

```
[ Logo Rentli | RO/EN | X ]   ← header drawer
─────────────────────────────
  Header card profil + 100%
  [ Adaugă anunț ] [ Admin ]
  ┌ Produsele mele         › ┐
  ┌ Închirieri             › ┐
  ┌ Balance RON  [Retrage] ┐
  │ IBAN •••0715           │
  └────────────────────────┘
  Finalizează contul   4/5 ›
  ⊕ Suport & Tickete    (2)
─────────────────────────────
  Categorii (explorer)
─────────────────────────────
[ RO/EN ]     [→ Deconectare ]   ← footer
```

## Verificare

Deschid preview-ul pe mobile (390×844), apăs hamburger, confirm că:
1. Apare header card cu avatar/nume/progres
2. CTA "Adaugă anunț" + Admin Panel funcționează
3. "Produsele mele" duce la `/anunturi`
4. Card balanță afișează RON + IBAN
5. Secțiunea de categorii rămâne intactă și expandabilă
6. Footer RO/EN + Logout funcționează
