## Redesign mobile drawer to match desktop hub

Refactor `MobileDrawer.tsx` to mirror the structure of `AccountHubMenu` (desktop), keeping mobile-specific affordances (swipe-close, full height, animation). All work stays in `src/components/layout/mobile-drawer/`.

### Top zone (sticky-ish, above the scroll area)

1. **Header bar** — keep logo + close button, add **RO / EN segmented switch** (two pill buttons) on the right next to the close icon, replacing the bottom-row `LanguageSwitcher`.
2. **Profile hero** — keep `DrawerProfileHero` as is.
3. **Stats grid (2×2)** — replace `DrawerQuickActions` with 4 desktop-style `StatusCard`s:
   - `active (chiriaș)` → /rezervari (badge: total active rentals)
   - `balanță` → /castiguri (with show/hide eye toggle, mirrors desktop `showBalance` localStorage key)
   - `cereri (proprietar)` → /inchirieri
   - `Vezi anunțurile mele` → /anunturi
4. **KYC status pill** (new, shown under stats) — single full-width row with icon + label + chevron:
   - `NOT_VERIFIED` / `REJECTED` → red (`bg-destructive/10`, destructive icon) — "Verifică-ți identitatea"
   - `IN_PROGRESS` / `SUBMITTED` / `NEEDS_MANUAL_REVIEW` → amber — "Verificare în curs"
   - `VERIFIED` → emerald with checkmark — "Identitate verificată"
   Links to `/verificare`. Uses `useKycGate` for status.
5. **Account Health** — keep existing `DrawerAccountHealth` (already auto-hides when all 3 items done). Render directly under the KYC pill.
6. **Primary CTA row** — "Adaugă anunț" gradient button + (if admin) "Panou Admin" emerald button, matching desktop layout. This replaces both the floating bottom CTA and the Admin nav group.

### Removed sections

- `DrawerSearch` ("Caută orice…")
- `DrawerContextualStatus` (replaced by KYC pill + stats badges)
- "Ca chiriaș" group (Închirierile mele, Favorite, Mesaje, Activitate)
- "Ca proprietar" group (Anunțurile mele, Cereri primite, Câștiguri, Recenzii)
- "Admin" nav group (replaced by top CTA button)

### Kept sections (in scroll area, below top zone)

- "Cont" group: Contul meu, Verificare KYC
- `DrawerCategoryExplorer` (categories)
- "Suport" group: Suport & Tickete

### Footer

- Remove the floating "Adaugă produs" CTA (moved to top zone).
- Keep a simple footer with the **Deconectare** button (full width, ghost/destructive variant), respecting `env(safe-area-inset-bottom)`.

### Files touched

- `src/components/layout/mobile-drawer/MobileDrawer.tsx` — recompose layout, add RO/EN switch, KYC pill, primary CTA row, remove deleted sections.
- `src/components/layout/mobile-drawer/DrawerQuickActions.tsx` — replace internals with `StatusCard`-style 2×2 grid (or inline new component `DrawerStatsGrid`).
- New: `src/components/layout/mobile-drawer/DrawerKycPill.tsx` — color-coded status row using `useKycGate`.
- No backend / API changes.

### Out of scope

- Desktop `AccountHubMenu` is unchanged.
- No changes to routes, queries, or business logic.