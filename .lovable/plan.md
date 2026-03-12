

## Plan: Add Reviews section to Profile page

### Overview
Add a new "Recenzii" (Reviews) tab to the profile page with two sub-tabs: reviews received from other users and reviews given to other users.

### Changes

**1. New database function** — `get_user_given_reviews_with_targets`
- Fetches reviews where `reviewer_id = target_user_id`, joining profiles to get the reviewed user's name and avatar.
- Similar pattern to the existing `get_user_reviews_with_reviewers` function but reversed.

**2. New API function** in `src/features/profile/reviewsApi.ts`
- Add `getUserGivenReviews(userId)` that calls the new RPC function.

**3. New component** — `src/components/profile/ReviewsTab.tsx`
- Two sub-tabs using existing Tabs component: "Primite" (Received) and "Date" (Given)
- Each tab shows a list of review cards with: avatar, name (linked to user profile), star rating, comment, date
- Shows counts in tab headers
- Empty state when no reviews exist

**4. Update `src/pages/Profile.tsx`**
- Add new tab entry `{ id: "recenzii", labelRo: "Recenzii", labelEn: "Reviews", icon: Star }` to the TABS array
- Add corresponding `TabsContent` rendering `ReviewsTab`

### Files affected
- `supabase/migrations/` — new migration for `get_user_given_reviews_with_targets`
- `src/features/profile/reviewsApi.ts` — add `getUserGivenReviews`
- `src/components/profile/ReviewsTab.tsx` — new component
- `src/pages/Profile.tsx` — add tab
- `src/integrations/supabase/types.ts` — auto-updated

