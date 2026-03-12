

## Plan: Improve Mobile Bottom Navigation

### Changes to `src/components/layout/MobileBottomNav.tsx`

**1. Spacing** — Add horizontal padding (`px-4`) to the nav container so items don't touch the screen edges (phone curvature).

**2. Rename "Vinde" → "Adaugă"** — Update the label in the tabs array.

**3. Prominent "Adaugă" button** — Use the `Plus` icon (not `PlusCircle`) rendered larger, white, inside a rounded circle with background `#F98715`. This makes it pop visually like a floating action button embedded in the nav bar. The icon will be rendered with a `-mt-3` offset to rise slightly above the bar.

### Implementation details

- Replace `PlusCircle` import with `Plus`
- Add a special `highlight` flag to the "Adaugă" tab
- For that tab, render the icon inside a `w-10 h-10 rounded-full bg-[#F98715] flex items-center justify-center -mt-3` container with a white `Plus` icon at `h-6 w-6`
- Add `px-4` to the outer flex container for safe edge spacing
- All other tabs remain unchanged

### Files affected
- `src/components/layout/MobileBottomNav.tsx`

