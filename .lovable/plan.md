

## Plan: User KYC Section in Account + Navigation Links

### What we're building
1. A **KYC verification section** inside "Contul meu" (AccountTab) where users can see their verification status and start/continue the KYC process
2. A **"Verificare KYC"** link in the Navbar dropdown menu (desktop) and offcanvas menu (mobile), placed **above** "Suport & Tickete"

### Changes

#### 1. `src/components/profile/AccountTab.tsx`
- Replace the static "Account Status" card (lines 321-343) with a dynamic KYC status section that:
  - Fetches the user's `kyc_status` and `kyc_level` from the `profiles` table
  - Shows current verification level with colored badge (VERIFIED=green, PENDING=amber, REJECTED=red, NOT_VERIFIED=gray)
  - If not verified or rejected: shows a prominent CTA button "Începe verificarea" linking to a future KYC upload flow (for now, a placeholder or info message)
  - If pending: shows "Verificare în curs" status
  - If verified: shows green checkmarks for completed levels

#### 2. `src/components/layout/Navbar.tsx` — Desktop dropdown (before line 227)
- Add a new `DropdownMenuItem` with `Shield` icon linking to `/profile#contul-meu` (scrolls to KYC section) or a dedicated `/verificare` route
- Text: "Verificare KYC" / "KYC Verification"
- Placed directly above the "Suport & Tickete" item

#### 3. `src/components/layout/Navbar.tsx` — Mobile offcanvas (before line 413)
- Add matching link with `Shield` icon above "Suport & Tickete"
- Same destination as desktop

#### 4. No new pages yet
- The KYC section lives inside AccountTab for now
- The nav links point to `/profile#contul-meu` where the KYC card is visible
- A full user-side KYC upload flow (document upload page) can be added as a follow-up

### Files to modify

| File | Change |
|------|--------|
| `src/components/profile/AccountTab.tsx` | Replace static account status with dynamic KYC status card fetching from profiles table |
| `src/components/layout/Navbar.tsx` | Add "Verificare KYC" link in desktop dropdown + mobile offcanvas above "Suport & Tickete" |

