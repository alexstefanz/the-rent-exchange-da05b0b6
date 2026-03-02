

## Plan: Add Balance Section to Profile Page

### What we'll build
A balance card displayed at the top of the Profile page (above the tabs), showing the user's current account balance calculated from their transactions in the database.

### Implementation

1. **Create a `BalanceCard` component** (`src/components/profile/BalanceCard.tsx`)
   - Fetches the user's balance by querying the `transactions` table (summing completed payouts minus withdrawals)
   - Displays a prominent card with a Wallet icon, the balance in RON, and a brief description
   - Shows loading skeleton while fetching

2. **Add `BalanceCard` to `Profile.tsx`**
   - Place it between the page header and the tabs section
   - Query: sum of `amount` from `transactions` where `user_id = current user`, `status = 'completed'`, grouped by type (owner_payout adds, withdrawal subtracts)

### Technical details
- Uses existing `transactions` table which already has RLS allowing users to view their own transactions
- No database changes needed -- the `transactions` table already exists with the right structure and policies
- Balance = SUM(completed payouts) - SUM(completed withdrawals)
- Uses `@tanstack/react-query` for data fetching, consistent with the rest of the app

