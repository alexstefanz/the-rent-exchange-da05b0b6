

# Plan: Rebrand -- Orange, Plus Jakarta Sans, New Logo/Favicon, Icon Style

## Summary
Complete visual rebrand: green → orange, new font, new logo/favicon, icon container shape change (rounded-square instead of circle).

## Changes

### 1. Update CSS variables & fonts (`src/index.css`)
- Change `--primary` from green `131 45% 50%` to orange `#F97717` → HSL `30 95% 53%`
- Change `--ring` to match new primary
- Change `--background` to `#F7F6F2` → HSL `50 20% 95%`
- Change `--font-heading` and `--font-body` to `'Plus Jakarta Sans', sans-serif`
- Update dark mode primary similarly

### 2. Update Tailwind config (`tailwind.config.ts`)
- Change `fontFamily.heading` and `fontFamily.body` to `["Plus Jakarta Sans", "sans-serif"]`

### 3. Update `index.html`
- Replace Google Fonts URL: load **Plus Jakarta Sans** instead of Playfair Display + DM Sans
- Update favicon to reference new file (`/favicon.png`)

### 4. Add gradient button variant (`src/components/ui/button.tsx`)
- Change `default` variant to use `background: linear-gradient(135deg, #F97717, #FAA73C)` with white text
- Also update `hero` and `accent` variants similarly

### 5. Copy new logo & favicon
- Copy `user-uploads://Rentli_logo_orange.png` → `src/assets/rentli_logo.png` (overwrite)
- Copy `user-uploads://favicon.png` → `public/favicon.png`
- Update `src/pages/Auth.tsx` to import from `rentli_logo.png` (currently uses `rentnow_logo.png`)

### 6. Icon container shape (`src/pages/Index.tsx`, `src/components/items/SubcategoryCard.tsx`)
- Change icon containers from `rounded-full` to `rounded-2xl` (rounded square like image 4)
- Make icons orange (`text-orange-500`) with light orange bg (`bg-orange-50`)

### 7. Remove `@fontsource` imports
- Remove `@fontsource/dm-sans` and `@fontsource/playfair-display` from `package.json` if imported anywhere

## Files affected
- `src/index.css` — CSS variables, font references
- `tailwind.config.ts` — font family
- `index.html` — Google Fonts URL, favicon
- `src/components/ui/button.tsx` — gradient default buttons
- `src/assets/rentli_logo.png` — replaced with orange logo
- `public/favicon.png` — new favicon
- `src/pages/Auth.tsx` — logo import fix
- `src/pages/Index.tsx` — icon container shape
- `src/components/items/SubcategoryCard.tsx` — icon container shape

