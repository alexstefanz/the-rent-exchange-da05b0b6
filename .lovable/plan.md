## Goal

Add an owner-side rental history page that mirrors the renter's `/rezervari` page ("Închirierile mele"), so the owner has a dedicated history view of all rentals on their listings (not just pending requests in `/anunturi?tab=cereri`).

## Changes

### 1. New page `src/pages/OwnerRentalsPage.tsx`
- Same layout/structure as `RentalsPage.tsx`.
- Header tone: owner (primary/15 + Store icon + "Ca proprietar" chip).
- Title RO/EN: "Istoric închirieri" / "Rental history".
- Subtitle: "Toate rezervările pe anunțurile tale" / "All bookings on your listings".
- Body renders `<RentalsOutTab />` (already lists owner-side rentals with all statuses).
- Back button → `/profile`.
- Reuses `BannedBanner`, `Navbar`, `Footer`.

### 2. Route in `src/App.tsx`
- Replace the current `<Route path="/inchirieri" element={<Navigate to="/anunturi?tab=cereri" replace />} />` with `<Route path="/inchirieri" element={<OwnerRentalsPage />} />`.
- Lazy import `OwnerRentalsPage`.
- Keep `/inchirieri/:publicId` route untouched.

### 3. Nav entry in `src/components/profile/dashboard/NavGroups.tsx`
- Under the "Ca proprietar" group, add a new item (after "Cereri primite"):
  - `to: "/inchirieri"`, icon `ScrollText` (or `History`), RO "Istoric închirieri", EN "Rental history", hint RO "Toate închirierile anunțurilor tale" / EN "All bookings on your listings".

## Out of scope
- No changes to `RentalsOutTab`, queries, or APIs.
- No email/notification changes.
- No DB changes.
