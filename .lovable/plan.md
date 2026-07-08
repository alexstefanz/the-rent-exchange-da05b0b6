
## Problem

The "double background" isn't only about sonner's own transitions — it also happens because parts of the app still call sonner **directly** (`toast.success(...)`, `toast.error(...)`, etc.) from `"sonner"`. Those toasts:

1. Don't share the global notification id (`rentli:notification-toast`), so they render **alongside** any `notify.*` card that is already visible → two cards stacked = "double background".
2. Inherit the global Toaster classNames (`!bg-transparent !border-0 !shadow-none !p-0`), which strips their styling and makes them look like broken cards behind the styled `NotificationToast`.

Legacy `useToast` from `@/hooks/use-toast` is already bridged to `notify` — good. The remaining leak is ~48 files importing `toast` directly from `"sonner"`.

## Plan

Single fix: make **all** toasts go through the same `notify.*` pipeline (same global id, same card), regardless of which import call sites use. Two coordinated steps:

### 1. Turn `@/components/ui/sonner`'s exported `toast` into a proxy

Replace the re-exported raw `toast` from sonner with a proxy that delegates:
- `toast(msg)` / `toast.message(...)` → `notify.system` / `notify.info`
- `toast.success(...)` → `notify.success`
- `toast.error(...)` → `notify.error` (via `notifyError` for Error objects)
- `toast.warning(...)` / `toast.warn(...)` → `notify.warning`
- `toast.info(...)` → `notify.info`
- `toast.custom / promise / loading / dismiss` → pass through to real sonner (kept for `notify` internals and any edge cases)

Accepts both `toast.success("msg")` and `toast.success("msg", { description })` shapes used in the codebase.

### 2. Codemod imports from `"sonner"` → `"@/components/ui/sonner"`

Rewrite every `import { toast } from "sonner"` (and any `import { toast, X } from "sonner"`) in `src/**` to import `toast` from `@/components/ui/sonner` instead. `@/lib/notify.tsx` keeps importing from `"sonner"` (it's the one place that must talk to the real API).

### Result

- Every `toast.success/error/info/warning/message(...)` call site — admin pages, checkout, rentals, messaging, KYC, etc. — automatically produces a properly styled `NotificationToast` card.
- All toasts share the single global id, so a new one atomically replaces the previous one. No two cards can ever overlap → no "double background", anywhere.
- Zero behavior change at call sites; no need to touch the 48 files beyond the import path.

## Files touched

- `src/components/ui/sonner.tsx` — export a proxy `toast` that routes to `notify`.
- `src/**/*.{ts,tsx}` (excluding `src/lib/notify.tsx`) — change `from "sonner"` to `from "@/components/ui/sonner"` (sed-based codemod).

## Verification

- Playwright: trigger a `notify.system` immediately followed by a `toast.error(...)` from an admin page pattern; confirm only one card is present in the DOM and screenshot shows a single background.
- Grep to confirm no remaining `from "sonner"` outside `src/lib/notify.tsx` and `src/components/ui/sonner.tsx`.
