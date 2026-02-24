

## Animated Blurred Green Gradient on Hero Banner

### What will change
The hero section background will get a large, blurred green gradient blob that animates horizontally (left to right and back) with a smooth ease-in-out transition over 5 seconds, creating a subtle living background effect.

### Technical Details

**1. Add a new keyframe animation in `tailwind.config.ts`**
- New keyframe `blob-drift` that translates horizontally from ~-20% to ~20% and back
- Duration: 5s, ease-in-out, infinite

**2. Update the hero section in `src/pages/Index.tsx`**
- Replace or augment the existing static radial gradient overlay with an animated blurred green blob
- The blob will be an absolutely positioned `div` with:
  - Large green (`hsl(var(--primary))`) radial gradient background
  - `blur(80px)` or similar for the blurred effect
  - `opacity` kept low so it's subtle
  - The new `animate-blob-drift` class applied
  - `pointer-events-none` so it doesn't interfere with interactions

### Files to modify
- `tailwind.config.ts` — add `blob-drift` keyframe + animation
- `src/pages/Index.tsx` — add the animated blurred div to the hero section

