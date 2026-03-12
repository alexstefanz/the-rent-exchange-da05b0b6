

## Plan: Fix CTA button colors on homepage

**Problem**: The `Button` component's default variant applies `bg-gradient-to-r from-[#F97717] to-[#FAA73C]` which overrides the custom `bg-[#FFFFFF]` and `bg-[#000000]` Tailwind classes due to CSS specificity/order.

**Fix** in `src/pages/Index.tsx` (lines 123-131):
- Change both buttons to use `variant="ghost"` (which only has `hover:bg-secondary`, no background) so the custom background classes take effect without conflict.

1 file modified, 2 lines changed.

