## Issue
On `/produs/...`, the sticky `MobileStickyBookingBar` (with "Selectează datele" + "Verifică datele"/"Întreabă") overlaps the new floating glass bottom nav, and its solid card/border style doesn't match the new nav aesthetic.

## Fix — single file: `src/components/product/MobileStickyBookingBar.tsx`

1. **Position above the floating nav, no overlap**
   - Outer wrapper becomes a floating container: `fixed left-3 right-3 z-[60]` with `bottom: calc(4rem + 12px + 12px + env(safe-area-inset-bottom))` (nav height 64px + nav's bottom-3 offset + 12px gap + safe area). This leaves a clean gap between the booking bar and the bottom nav.

2. **Glass pill styling, consistent with `MobileBottomNav`**
   - Replace `bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_...]` with:
     `rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]`
   - Inner padding remains `px-4 pt-3 pb-3`.

3. **Buttons polish to match**
   - "Verifică datele" / "Rezervă acum" primary button keeps `bg-primary` but gets `rounded-full` and a soft orange glow `shadow-[0_6px_20px_-4px_rgba(249,135,21,0.45)]` echoing the floating "Adaugă" button.
   - "Întreabă" outline button: `rounded-full bg-white/70 border-white/70 backdrop-blur` so it reads as part of the glass surface.

## Out of scope
- No changes to `MobileBottomNav`, desktop booking card, or any logic. Pure visual/positional tweak to the mobile sticky bar.
