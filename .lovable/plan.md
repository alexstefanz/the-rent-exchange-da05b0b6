## Problem
The desktop Account Hub dropdown is too tall and overflows past the viewport, hiding the "Suport" section and footer (logout, language switcher).

## Fix
Constrain the `DropdownMenuContent` height to ~half the viewport and make the inner content scroll, while keeping the header and primary CTA always visible.

### Changes in `src/components/layout/AccountHubMenu.tsx`

1. **DropdownMenuContent (desktop)**
   - Add `max-h-[min(640px,75vh)]` and switch to a flex column with `p-0` so we control internal padding.
   - Wrap `{Body}` in a scroll container.

2. **Restructure `Body` into 3 zones** (used by both desktop and mobile):
   - **Sticky top (no scroll):** HeaderCard + Quick status grid + "Adaugă anunț" CTA. Stays pinned so the user always sees identity, balance, and the primary action.
   - **Scrollable middle:** Account Health + Activitate / Cont / Suport / Admin nav groups. Gets `overflow-y-auto` with a thin custom scrollbar and subtle top/bottom fade masks to hint scrollability.
   - **Sticky footer:** Language switcher + Logout, with a top border so it visually separates from the scroll zone.

3. **Density tweaks** (small, to fit more without scrolling):
   - Reduce vertical padding on `NavRow` from `py-2` to `py-1.5`.
   - Reduce `SectionLabel` `pt-3` to `pt-2`.
   - Reduce gap between Quick status grid and CTA from `mt-3` to `mt-2`.

4. **Mobile Sheet**: keep `max-h-[92dvh]` but apply the same 3-zone layout so the CTA and header don't scroll away on small screens either. Drag handle stays above the sticky header.

### Out of scope
- No changes to data hooks, routing, or the trigger button.
- No changes to mobile bottom nav.

### Result
Desktop dropdown caps at ~640px (or 75vh on shorter screens). The user always sees the header + CTA + footer; only the middle nav list scrolls, so "Suport", "Admin" and "Ieși din cont" are always reachable.
