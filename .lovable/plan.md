## Goal

Unify the colors of the **Status** and **Plată** badges across the admin dashboard, and rename `captured` → `Plătit`, so admins can visually associate them at a glance.

## Color Mapping

**Status (rezervare)**
- `pending` (În așteptare) → **Galben** (yellow-100/yellow-800)
- `confirmed` (Confirmată) → **Albastru** (blue-100/blue-800) — kept (subset of "active flow")
- `active` (Activă) → **Albastru** (blue-100/blue-800) ← changed from verde
- `completed` (Finalizată) → **Verde** (green-100/green-800) ← changed from gri
- `cancelled` (Anulată) → **Roșu** (red-100/red-800)
- `overdue` (Întârziată) → **Portocaliu** (orange-100/orange-800) — kept

**Plată**
- `pending` / `unpaid` (Neplătit) → **Roșu** (red-100/red-800) ← changed from outline
- `captured` → relabeled **Plătit**, **Verde** (green-100/green-800)
- `paid` (Plătit) → **Verde** (green-100/green-800)
- `refunded` (Rambursat) → **Portocaliu** (orange-100/orange-800)
- `failed` (Eșuat) → **Roșu** (red-100/red-800)

Both badges will use the same colored-pill style (`Badge` with custom `className`), so identical states share the same visual.

## Files to update

1. **`src/pages/admin/AdminReservations.tsx`**
   - Update `statusColors` map (active → blue, completed → green).
   - Replace the `paymentStatusLabels` map with a combined `paymentStatusLabels` + `paymentStatusColors` map that includes `captured: "Plătit"` and `pending: "Neplătit"`.
   - Replace both `<Badge variant=…>` for payment (desktop table + expanded panel) with `<Badge className={paymentStatusColors[…]}>` so colors apply.

2. **`src/pages/admin/AdminDashboard.tsx`**
   - Update its local `statusColors` map with the same palette.
   - If it renders payment status, apply the same `paymentStatusColors` map (add it if missing).

3. **`src/pages/admin/AdminFinances.tsx`**
   - Same treatment: align `statusColors` and add `paymentStatusColors` + `Plătit` label where payment is shown.

4. **`src/components/admin/RentalPaymentStatus.tsx`**
   - In `statusVariant`, change `active` to blue, `completed` to green.
   - When rendering the `captured` payment label, display **"Plătit"** (keep the underlying value `captured` intact — only the displayed text changes).

5. **`src/components/admin/user-detail/UserRentalsTab.tsx`**
   - Update `statusColors` map to match.

## Out of scope

- Database values are **not** renamed — `captured` stays as the canonical payment status in DB and code; only the UI label becomes "Plătit".
- Renter/owner dashboards (`RentalsTab`, `RentalsOutTab`, `LendingsTab`) and the `StatusBadge` shared component are **not** touched in this pass — request was specifically for admin dashboard. We can extend after if you want.

## Acceptance

- In Admin → Rezervări (and Dashboard, Finanțe), the Status column shows yellow / blue / green / red / orange pills per the mapping above.
- The Plată column shows red for Neplătit and green pill labeled **"Plătit"** for captured rentals.
- Same visuals appear on both desktop table and mobile cards, and inside the expanded rental panel.
