

## Plan: Change Icon Containers from Circular to Rounded Square

The uploaded image shows a squircle/rounded-square icon container. Currently, most decorative icon containers across the app use `rounded-full` (circular). The `SubcategoryCard` already uses `rounded-2xl` which matches the desired style.

### Files to update (change `rounded-full` to `rounded-2xl` on icon containers only)

1. **`src/pages/Index.tsx`** -- "How it works" section icons (line ~91)
2. **`src/pages/Contact.tsx`** -- Contact card icon (line ~43)
3. **`src/pages/Categories.tsx`** -- Category icons (line ~81)
4. **`src/pages/HowItWorks.tsx`** -- Step number circles (line ~50)
5. **`src/components/CookieConsent.tsx`** -- Cookie icon (line ~38)
6. **`src/components/profile/AccountTab.tsx`** -- Support icon (line ~527)

### What stays `rounded-full` (no change)
- Action buttons (back, share, favorite, close, lightbox nav)
- Notification dots, badge indicators
- Switch component, search button
- Carousel dot indicators
- Avatar components

### Scope
~6 files, single class name change per file. Zero risk.

