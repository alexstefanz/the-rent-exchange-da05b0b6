## Plan: Resize mobile booking sticky bar

### Scope
Adjust only `src/components/product/MobileStickyBookingBar.tsx` to make the mobile booking container more compact.

### Changes
1. Scale the container down by ~20%:
   - Reduce outer padding (`px-4 pt-3 pb-3` → smaller values).
   - Reduce internal gap (`gap-2.5` → smaller).
   - Lower bottom positioning offset slightly if needed.
2. Reduce buttons and button text:
   - Change `size="lg"` to `size="sm"` (or custom smaller class) and lower `h-11` height.
   - Reduce button text font size and icon size.
3. Keep the same layout, interaction logic, and the Sheet content unchanged.

### Verification
- Preview on mobile viewport (390x844).
- Confirm the bar is visibly smaller but still readable and tappable.

No backend or business-logic changes are required.