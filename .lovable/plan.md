## Problem

The "Anunț trimis spre aprobare" popup (and any other `notify.*` / legacy `toast()` call) renders as two stacked cards — a white sonner wrapper with its own background/border/shadow, plus the inner `NotificationToast` card that also has `bg-background`, border, and shadow. That's the "double background" visible in the screenshot.

Root cause: every toast in the app goes through `src/lib/notify.tsx` → `toast.custom(..., { unstyled: true, classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0 !rounded-none !w-auto" } })`. But the global `<Toaster>` in `src/components/ui/sonner.tsx` applies these `!important` classes on `toastOptions.classNames.toast`:

```
group-[.toaster]:!bg-background
group-[.toaster]:!border !border-border/60
group-[.toaster]:!rounded-2xl
group-[.toaster]:!shadow-[...]
group-[.toaster]:!px-4 group-[.toaster]:!py-3
```

Because sonner merges global `toastOptions.classNames` with per-toast `classNames`, and both use `!important`, the global wrapper still shows a background/border behind every custom card.

## Fix — single file, presentation only

Update `src/components/ui/sonner.tsx`:

1. Remove the wrapper background, border, shadow, radius, and padding from `toastOptions.classNames.toast`. The wrapper becomes a transparent, zero-padding container — the visible card is always the `NotificationToast` inside.
   - New value: `"group toast group-[.toaster]:!bg-transparent group-[.toaster]:!border-0 group-[.toaster]:!shadow-none group-[.toaster]:!p-0 group-[.toaster]:!rounded-none group-[.toaster]:!w-auto group-[.toaster]:!opacity-100"`.
2. Leave `description`, `actionButton`, `cancelButton`, and `closeButton` classNames as-is (unused by custom toasts, harmless for any future default toast).
3. Keep `position="bottom-center"`, `offset`, `duration`, `visibleToasts`, `expand`, `gap`, `closeButton={false}` unchanged.

No changes to `notify.tsx`, `use-toast.ts`, or any caller. Since every toast in the codebase already uses `toast.custom` via `notify`, moving the styling responsibility fully into `NotificationToast` produces a single, consistent card for:

- publish success/resubmit toasts (`PublishWizard`)
- all `notify.confirmation/cancellation/payment/support/system/message/request/warning/info/kyc/success/error` calls
- realtime DB notifications via `notifyFromDb`
- legacy `toast({ title, description, variant })` bridged through `src/hooks/use-toast.ts`

## Verification

1. Publish/resubmit a listing → single card, no double background, close (X) still works.
2. Trigger an error toast (e.g. failed action) → single red-accent card.
3. Realtime notification (message/rental request) → single card with correct variant color.
4. Visual check on mobile + desktop that offset above the chat FAB is preserved.

## Out of scope

- No changes to notification content, variants, icons, spacing inside `NotificationToast`.
- No backend, RLS, or data changes.
