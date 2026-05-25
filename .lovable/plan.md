## Problem
On mobile checkout (`/checkout`), the sticky bottom bar's "Trimite cererea" button uses `flex-1`, which stretches it and squeezes the "TOTAL 1.05 RON" column so the number touches the screen edge on iPhone.

## Change
In `src/components/checkout/StickyCheckoutBar.tsx`, on the `<Button>`:

- Replace `flex-1` with a constrained width ~20% smaller, e.g. `flex-none basis-[60%] max-w-[60%]` (currently the button effectively takes ~75% after gap/total; reducing to ~60% = ~20% narrower).
- Keep height, font, and shadow as-is.

This gives the total column more breathing room while keeping the CTA clearly tappable.

No other files affected.