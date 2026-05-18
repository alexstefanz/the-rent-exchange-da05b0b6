## Problem

Notification bell shows the new in-app notification ("Cerere nouă de închiriere") in the DB, but no bottom-center toast appears. So the DB row is inserted correctly — the issue is between the Realtime delivery and the Sonner toast render.

## Likely causes

Three independent suspects, in order of probability:

1. **Renter-side: page redirect to Stripe kills the realtime event.** On `Checkout`, the edge function creates the rental → inserts the `request_created` notification (for both parties) → then returns the Stripe URL → the renter's browser leaves the SPA. Sonner has no time to render. When the renter returns to `/checkout/success`, the realtime channel re-subscribes but does NOT replay missed `INSERT`s.

2. **Owner-side: realtime callback fires but Sonner doesn't render the bottom-center toast.** Our `<Sonner Toaster>` is mounted with `position="top-center"` at the container, while `notify.tsx` passes `position: "bottom-center"` per toast. Sonner 1.7 supports per-toast position, but combined with our `unstyled: true` + the Toaster-level `closeButton` + `toastOptions.classNames` it sometimes fails to mount a second region. No console error — the toast just never appears.

3. **Realtime payload missing required fields.** `notifyFromDb` reads `title_ro`/`description_ro`. If the trigger or edge function inserts a row with `null` `title_ro`, `notifyFromDb` would throw and be swallowed by the `try/catch` (only logged). The bell still shows the row because it has fallback text.

## Plan

### Step 1 — Add diagnostic logs (temporary)

In `src/hooks/useGlobalRealtime.ts`, log every notification INSERT payload received so we can confirm in the next user message whether the event reached the client at all:

```ts
.on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
  (payload) => {
    console.log("[realtime] notification INSERT", payload.new);
    ...
  }
)
```

In `src/lib/notify.tsx` → `notifyFromDb`, log when it fires and what variant is chosen.

### Step 2 — Add a dedicated bottom-center Sonner viewport

Mount a SECOND `<Sonner />` in `src/App.tsx` configured explicitly for `position="bottom-center"` and remove the per-toast `position` override in `notify.tsx`. This eliminates the "two positions on one Toaster" ambiguity. The top-center Sonner stays for any legacy `toast.*` calls.

### Step 3 — Render a renter-side toast on `/checkout/success`

Because the Stripe redirect breaks realtime delivery for the renter, on `CheckoutSuccess` mount, explicitly fire a confirmation toast ("Cerere trimisă"/"Plată reușită") using `notify.confirmation(...)`. Idempotent — only fires once per rental id via `sessionStorage`. This guarantees the renter always sees feedback after returning from Stripe.

### Step 4 — Harden `notifyFromDb`

Add a safer fallback: if `title_ro` is empty, fall back to a generic title derived from `type` so the toast still shows (and log a warning). Prevents silent failure on malformed rows.

### Step 5 — Ask user to retry and share console output

After the diagnostic logs and fixes ship, ask the user to repeat the test rental. The `[realtime] notification INSERT` console line will tell us definitively whether the event is reaching the browser, and which fix path resolved it. Once confirmed, the diagnostic `console.log`s will be removed.

## Files touched

- `src/hooks/useGlobalRealtime.ts` — add log
- `src/lib/notify.tsx` — log + safer fallback + remove per-toast position override
- `src/components/ui/sonner.tsx` (or `src/App.tsx`) — add second Sonner instance at bottom-center
- `src/pages/CheckoutSuccess.tsx` — fire confirmation toast once per rental
