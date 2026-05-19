## Goal
Merge "Cereri primite" (`/inchirieri`, RentalsOutPage) into "Produsele mele" (`/anunturi`, ListingsPage) as a single page with two tabs at the top: **Anunțuri** (current listings management) and **Cereri** (received bookings — currently RentalsOutTab).

## Behavior

- `/anunturi` — default page, opens **Anunțuri** tab.
- `/anunturi?tab=cereri` — opens **Cereri** tab directly. Tab state is synced to the URL query param so deep-links and back/forward navigation work.
- `/inchirieri` route now redirects to `/anunturi?tab=cereri` (kept for old links and detail-page back-button compatibility).
- `/inchirieri/:publicId` (rental detail) **remains unchanged** — only the list page is merged.

## UI

- Page wrapper with the existing back-to-account button and a new top-level `<Tabs>` (shadcn) with two triggers: "Anunțuri" / "Cereri primite". A small `Badge` next to "Cereri" shows count of pending/actionable requests when > 0 (reuse RentalsOutTab's existing query or `useOwnerListingsStats` if it exposes a count — otherwise just count `RentalsOutTab` items via the same hook the tab uses).
- **Anunțuri** tab: keeps everything currently in `ListingsPage` (header, stats bar, status sub-tabs, filter bar, grid of `ListingCard`s, dialogs, mobile sticky "Adaugă produs" CTA).
- **Cereri** tab: renders `<RentalsOutTab />` (current component, unchanged) plus a small header strip ("Cereri primite — Rezervări pentru anunțurile tale").
- The "Vezi cereri primite" link inside `ListingsStatsBar` (`onOpenRentals`) now switches to the Cereri tab in-page instead of navigating away.

## Updates to internal links

Update all current `to="/inchirieri"` references so they continue to land on the right place after the merge:

- `src/components/layout/Footer.tsx` → `/anunturi?tab=cereri`
- `src/components/profile/dashboard/SmartCards.tsx` (2 occurrences) → `/anunturi?tab=cereri`
- `src/components/profile/dashboard/QuickActions.tsx` → `/anunturi?tab=cereri`
- `src/components/profile/dashboard/NavGroups.tsx` → `/anunturi?tab=cereri`
- `src/components/layout/mobile-drawer/DrawerQuickActions.tsx` → `/anunturi?tab=cereri`
- `src/components/layout/AccountHubMenu.tsx` "Închirieri" row → `/anunturi?tab=cereri`
- `src/pages/RentalDetailPage.tsx` back button stays `/inchirieri` (handled by the redirect, or change to `/anunturi?tab=cereri`).

`TransactionDetailDrawer`, `TransactionCard`, and `RentalsOutTab` detail links to `/inchirieri/:publicId` stay unchanged.

## Files

- `src/pages/ListingsPage.tsx` — wrap content in `<Tabs>` with `value` driven by `useSearchParams`; render `RentalsOutTab` inside the second tab; update `ListingsStatsBar.onOpenRentals` to set `?tab=cereri`.
- `src/App.tsx` — replace `<Route path="/inchirieri" element={<RentalsOutPage />} />` with `<Navigate to="/anunturi?tab=cereri" replace />`. Keep `/inchirieri/:publicId` for rental detail.
- Delete `src/pages/RentalsOutPage.tsx` (no longer routed). `RentalsOutTab` component stays.
- Update the 6 link references listed above.

No backend / data changes.
