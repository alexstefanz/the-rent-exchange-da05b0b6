## Issue

On mobile, Sonner stretches each toast slot to nearly full viewport width (measured 375px on a 390px screen, anchored at `left: 16px`). Our `NotificationToast` card inside has a fixed width (`min(380px, calc(100vw - 32px))`) and sits left-aligned inside that slot instead of centered.

## Fix

Center the toast on mobile without changing desktop behavior or the card design.

1. `src/components/ui/sonner.tsx` — in `toastOptions.classNames.toast`, add utilities so the wrapper shrinks to its content and centers:
   - `!w-auto !left-1/2 !-translate-x-1/2` (mobile) with an `lg:` reset so desktop `bottom-center` behavior stays unchanged.
   - Alternatively add `!flex !justify-center !w-full` on the wrapper so the inner fixed-width card centers inside the slot. Prefer this second form since it avoids fighting Sonner's inline transforms.

2. `src/index.css` — add a small mobile-only safety rule (max-width: 767px) forcing `[data-sonner-toaster][data-y-position="bottom"] > li` to center its content (`display:flex; justify-content:center;`) in case utility specificity is stripped by Sonner's inline styles.

## Verification

Re-run the Playwright mobile snapshot (390×800) and confirm the `NotificationToast` bounding box is horizontally centered (left ≈ (390 − cardWidth) / 2). Re-check desktop (1280 wide) is unchanged.
