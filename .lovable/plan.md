## Problem

The chat unread badge (navbar bell next to Messages, plus the "Rezervări / De Închiriat" tab counts and the per-conversation dot) only refreshes when the user opens the messaging area. New incoming messages don't bump the badge live — same root cause we just fixed for notifications:

1. `useGlobalRealtime` subscribes to `messages` INSERT events, but the channel reaches `SUBSCRIBED` **before** `supabase.realtime.setAuth(access_token)` has fully propagated. Any INSERT that fires in that window is dropped by RLS and never invalidates the `["conversations", userId]` cache.
2. There is no fallback: if the websocket briefly drops (tab backgrounded, network blip), the cache stays stale until the user manually navigates back to `/messages`.

## Fix (UI / data-layer only — no backend, no schema)

**`src/hooks/useGlobalRealtime.ts`**

1. In the `.subscribe((status) => …)` callback, when `status === "SUBSCRIBED"` immediately invalidate the messaging-related caches once:
   - `["conversations", userId]`
   - `["unread-messages", userId]`
   This catches any INSERT that fired between login and channel readiness — exact mirror of the notifications fix.

2. Add a second `useEffect` with `window` `focus` and `document` `visibilitychange` listeners. When the tab becomes visible, invalidate:
   - `["conversations", userId]`
   - `["unread-messages", userId]`
   - `["notifications", userId]` (consolidate — currently lives only in `useNotifications`; keeping it here too is harmless and guarantees both badges refresh on tab return even if the user is not on a page that mounts `useNotifications`).

That's it. No changes to `Navbar.tsx`, `ConversationList`, `NotificationBell`, or any messaging component — they all read from the React Query cache, so the badges re-render automatically once the cache updates.

## Validation

From a second account, send a chat message to `alesso.cwalk@yahoo.com` while that user is on the homepage (not on `/messages`):
- The Navbar Messages icon should show the unread badge within ~1s, no click required.
- Opening the panel shows the new message already there (no fetch flicker).
- Switch tabs away and back → badge state stays correct.
