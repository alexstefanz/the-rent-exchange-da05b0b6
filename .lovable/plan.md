## Problem

When a new notification arrives, the data updates only after the user opens the bell. The badge counter on the closed bell stays at 0 until the popover opens. That means the Realtime INSERT event isn't reaching the `useNotifications` subscription that powers `NotificationBell`; the count only refreshes because opening the popover mounts `NotificationCenter` and triggers a refetch (stale-after-30s).

Root cause is a race between Supabase Realtime auth and the channel subscription:
- `NotificationBell` mounts very early (in the navbar) and calls `useNotifications(user.id)`.
- The channel `notifications-realtime-${userId}` subscribes immediately, often **before** `supabase.realtime.setAuth(access_token)` has propagated.
- RLS on `notifications` then drops the INSERT payload server-side, so the bell never sees the new row.
- When the user opens the popover, `NotificationCenter` re-renders and React Query refetches (data is stale), so the badge appears retroactively.

## Fix

1. **`src/hooks/queries/useNotifications.ts`**
   - When the channel reaches `SUBSCRIBED` status, immediately call `queryClient.invalidateQueries({ queryKey: KEY })`. This catches any notification that arrived between login and subscription readiness, so the bell badge updates without any user interaction.
   - Add a lightweight resilience layer: refetch on `window` focus and on `document` `visibilitychange` → `visible`. This guarantees the badge updates the moment the user returns to the tab, even if the websocket dropped briefly.
   - Re-create the channel when `userId` changes (already handled) and ensure `supabase.realtime.setAuth(...)` is awaited via a small effect that resubscribes once a token is present (defensive — we already set it in `AuthContext`, this just retries the subscribe after a tick if the first SUBSCRIBED came back without auth).

2. **`src/components/layout/NotificationBell.tsx`** — no logic changes needed. It already reads from the React Query cache, so once the hook updates the cache the badge re-renders automatically.

## Validation

- Trigger a new rental request from another account against `alesso.cwalk@yahoo.com`.
- Without clicking anything, the bell badge should show `1` within ~1s.
- Open the popover → notification is already visible (no extra fetch flicker).
- Switch tabs away and back → badge stays correct.

No backend, schema, or copy changes. UI/data-layer only.