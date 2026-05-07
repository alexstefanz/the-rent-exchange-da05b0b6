## Problem

The "Identitate verificată ✓" notification redirects to `/recenzii` (Reviews) instead of the "Add product" CTA.

Cause:
- Older `kyc_approved` notifications stored in DB use `link = '/profile'`.
- `NotificationBell.tsx` mapLink contains a fallback rule: `if (link === "/profile") return "/recenzii"`, which sends the user to Reviews.
- The newer trigger (migration `20260503112903`) already writes `/owner/new-product`, but historical rows still point at `/profile`.

## Changes

### 1. `src/components/layout/NotificationBell.tsx`
- Remove (or replace) the rule that sends bare `/profile` links to `/recenzii`. Instead, route by notification `type`:
  - When `n.type === 'kyc_approved'` → navigate to `/owner/new-product` regardless of stored link.
  - Drop the `/profile → /recenzii` catch-all so generic `/profile` links land on the profile hub.

### 2. `src/components/profile/NotificationsTab.tsx`
- Apply the same `kyc_approved → /owner/new-product` override in its click handler (so the in-page list behaves identically to the bell).

### 3. Migration: `supabase/migrations/<timestamp>_kyc_approved_link_fix.sql`
- Backfill existing rows so the link is correct everywhere:
  ```sql
  UPDATE public.notifications
  SET link = '/owner/new-product'
  WHERE type = 'kyc_approved'
    AND (link IS NULL OR link = '/profile');
  ```
- The trigger function is already correct (uses `/owner/new-product`); no further trigger change needed.

## Result

Clicking the "Identitate verificată ✓" notification (bell or notifications page, old or new) takes the user directly to the "Adaugă produs" page (`/owner/new-product`), matching the email CTA.