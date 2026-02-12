
# Add "Requests" Tab and Separate Successfully Rented Items

## Overview
Split the current "My Rentals" tab into two distinct tabs:
- **Requests** (Cereri) -- shows pending rental requests (awaiting owner response), with the cancel option
- **My Rentals** (Inchirierile mele) -- shows only successfully rented items (confirmed, active, completed)

## Changes

### 1. Update Profile Tab Navigation (`src/pages/Profile.tsx`)
- Add a new tab entry `{ id: "cereri", labelRo: "Cereri", labelEn: "Requests", icon: ClipboardList }` after Favorites
- Add corresponding `TabsTrigger` and `TabsContent` for the new tab
- Import a new `RequestsTab` component

### 2. Create `src/components/dashboard/RequestsTab.tsx`
- Fetch rentals where `status = 'pending'` or `status = 'cancelled'` for the current user (as renter)
- Show pending requests with the existing cancel button (24h window logic)
- Show cancelled requests in a separate "history" section
- Empty state: "No pending requests" with a link to search

### 3. Update `src/components/dashboard/RentalsTab.tsx`
- Remove pending requests from this tab -- only show `confirmed`, `active`, `completed` rentals
- Remove the cancel button logic (moved to RequestsTab)
- Simplify the "upcoming" section to confirmed/active only
- Keep completed in a "past" section
- Update empty state messaging

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Add "Cereri" tab + import RequestsTab |
| `src/components/dashboard/RequestsTab.tsx` | New component for pending/cancelled requests |
| `src/components/dashboard/RentalsTab.tsx` | Remove pending items, simplify to confirmed/active/completed only |
