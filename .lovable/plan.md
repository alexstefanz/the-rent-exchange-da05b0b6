

## Plan: Fix "Discută cu proprietarul" to open the correct conversation

### Problem
Two issues prevent the correct conversation from opening:

1. **`getRentalDetailsForNotification` fetches the WRONG rental** — it always gets the *most recent* rental for the user, ignoring which notification was clicked. So `details.product_id` may point to a completely different product.

2. **Messages page auto-select has a tab mismatch** — the conversation may be in the "De Închiriat" tab but `activeTab` defaults to "rezervari", so the user doesn't see it selected in the list.

### Changes

**1. Store `rental_id` in notification link (Edge Functions)**

Update the notification `link` field in `send-rental-notification/index.ts` and `respond-rental-request/index.ts` to include the rental ID:
- `/cereri?rental_id={rental_id}` instead of just `/cereri`
- `/anunturi?rental_id={rental_id}` instead of just `/anunturi`

**2. Fix `getRentalDetailsForNotification` to use the rental ID**

In `src/features/rentals/rentalDetailsApi.ts`, parse the `rental_id` query param from the notification link and fetch that specific rental instead of the most recent one. Fall back to current behavior if no ID is present (backward compat).

**3. Fix Messages page auto-select to switch tab**

In `src/pages/Messages.tsx`, when auto-selecting from `?conv=` param, also determine the correct tab (check if `buyer_id === user.id` → "rezervari", else "de_inchiriat") and call `setActiveTab` accordingly.

**4. Ensure `handleStartChat` query is robust**

In `src/components/profile/NotificationsTab.tsx`, the conversation lookup query uses `.or(buyer_id.eq, owner_id.eq)` which could match wrong conversations. Tighten it to also filter by the other participant to find the exact conversation between both parties for that product.

### Files modified
- `supabase/functions/send-rental-notification/index.ts`
- `supabase/functions/respond-rental-request/index.ts`  
- `src/features/rentals/rentalDetailsApi.ts`
- `src/pages/Messages.tsx`
- `src/components/profile/NotificationsTab.tsx`

