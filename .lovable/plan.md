## Goal
Transform the mobile bottom navigation (`MobileBottomNav.tsx`) into a floating glassmorphism pill — white translucent background with orange accents — inspired by the Apple News+ / iOS pill examples.

## Visual direction
- **Floating pill**, detached from the screen edges: `fixed bottom-3 left-3 right-3`, with `env(safe-area-inset-bottom)` padding preserved below.
- **Glass effect**: `bg-white/60` + `backdrop-blur-xl` + `backdrop-saturate-150`, subtle inner highlight via `border border-white/60`, soft drop shadow (`shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]`).
- **Shape**: full rounded pill (`rounded-full`), height ~64px.
- **Active tab**: orange text (`text-primary` = #F59E0B) + small orange dot or soft orange tinted background pill behind the icon (`bg-primary/10`), matching the iOS "selected segment" feel.
- **Inactive tabs**: dark neutral icon/label (`text-foreground/70`).
- **Center "Adaugă" button**: keep the solid orange circle (#F98715), slightly elevated above the pill with a soft orange glow (`shadow-[0_6px_20px_-4px_rgba(249,135,21,0.5)]`) so it pops like the red search bubble in image 3.
- **Badge** (unread chat): keep destructive red dot, repositioned cleanly over the glass.

## Files to change
1. **`src/components/layout/MobileBottomNav.tsx`** — rewrite the outer `<nav>` container styling (floating pill, glass, rounded-full), tweak per-tab active styling (orange pill behind active icon), keep the highlight Plus button visually lifted.
2. **`src/index.css`** — adjust the mobile body bottom padding (`@media (max-width: 1023px) { body { padding-bottom: ... } }`) from `4rem` to ~`5.5rem` so floating nav doesn't overlap page content.

## Non-goals
- No changes to desktop navbar, routes, icons set, badge logic, or banned-state behavior.
- No new dependencies.
