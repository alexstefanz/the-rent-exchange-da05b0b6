

## Plan: Fix accordion content responsive layout on mobile

The issue is that all expanded panels use `grid grid-cols-2` which causes text overlap on 390px screens. The fix is to change the grid to `grid-cols-1` on mobile and `grid-cols-2` on larger screens across all admin expanded panels.

### Changes

**1. `src/pages/admin/AdminReservations.tsx` — `RentalExpandedPanel`**
- Line 60: Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Add `break-words` / `truncate` on long text spans (period, email)

**2. `src/pages/admin/AdminTickets.tsx` — `TicketExpandedPanel`**
- Line 43: Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Wrap long date/category text properly

**3. `src/pages/admin/AdminKYC.tsx` — `KycExpandedPanel`**
- Line 26: Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Add `break-all` or `truncate` on email field to prevent overflow

**4. `src/pages/admin/AdminFinances.tsx` — `TxExpandedPanel`**
- Line 40: Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3`

**5. `src/pages/admin/AdminUsers.tsx` — `UserExpandedPanel`**
- Line 34 (in the provided file): Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3`

### Summary
Single change pattern applied to 5 files: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` in all expanded panel components, plus `truncate`/`break-all` on long text fields (emails, addresses).

