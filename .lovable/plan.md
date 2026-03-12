

## Plan: Fix notification click navigation to dedicated pages

### Problem
Notification links are stored as `/profile#cereri`, `/profile#anunturi`, etc., but these sections now live on dedicated pages (`/cereri`, `/anunturi`, `/rezervari`, `/notificari`). Clicking a notification doesn't navigate to the correct page.

### Changes

**1. Update `mapLink` in `src/components/layout/NotificationBell.tsx`** (line 160-164)

Update the mapping to route to the new dedicated pages:
- `/profile#anunturi` → `/anunturi`
- `/profile#cereri` → `/cereri`  
- `/profile#rezervari` → `/rezervari`
- `/profile#notificari` → `/notificari`
- `/profile` (for reviews) → `/recenzii`

**2. Update `src/components/profile/NotificationsTab.tsx`**

Add navigation on notification click (using `useNavigate`). When a notification has a `link`, clicking it should navigate to the mapped destination page instead of only expanding inline. Keep the expand behavior for rental notifications as secondary detail, but also add a navigation action.

Apply the same `mapLink` logic as in NotificationBell.

**3. Update Edge Functions to use new links** (prevents stale data for future notifications)

Update the `link` field in all 4 edge functions:
- `send-rental-notification/index.ts`: `/profile#anunturi` → `/anunturi`, `/profile#cereri` → `/cereri`
- `respond-rental-request/index.ts`: `/profile#cereri` → `/cereri`
- `send-cancellation-notification/index.ts`: `/profile#anunturi` → `/anunturi`
- `send-general-notification/index.ts`: `/profile` → `/recenzii` (for review_received)

**4 files modified, no new files or dependencies.**

