

# Mobile Performance Optimization Plan

## 1. Fix LCP Image Priority (Hero Section)
**File: `src/pages/Index.tsx`**
- Replace the CSS `background-image` div with an `<img>` element using `fetchpriority="high"`, `decoding="async"`, no lazy loading
- Keep `absolute inset-0 w-full h-full object-cover opacity-40` styling

## 2. Route-Based Code Splitting
**File: `src/App.tsx`**
- Convert all non-homepage route imports to `React.lazy()` with `Suspense` wrapper
- Keep `Index` as eager import; lazy-load everything else (Categories, ProductDetail, Profile, Admin pages, etc.)

## 3. Add Preconnect Links
**File: `index.html`**
- Add `<link rel="preconnect">` for `fonts.googleapis.com`, `fonts.gstatic.com`, and the backend URL
- Google Fonts already uses `display=swap` (confirmed in `index.css`)

## 4. Optimize Product Card Images
**File: `src/components/home/FeaturedListings.tsx`**
- Add `width`, `height`, `loading="lazy"`, `decoding="async"` to all product card images
- First row visible images (index 0-1 on mobile) use `loading="eager"`; rest use `loading="lazy"`

**File: `src/components/products/ProductCard.tsx`**
- Add `width="480" height="360"` and `loading="lazy" decoding="async"` to product images

## 5. Fix Logo Image Dimensions
**File: `src/components/layout/Navbar.tsx`**
- Add explicit `width` and `height` attributes to the logo `<img>` tags (both desktop and mobile menu)

## 6. Optimize Font Loading
**File: `src/index.css`**
- The Google Fonts `@import` in CSS is render-blocking. Move it to a `<link>` tag in `index.html` with `media="print" onload` pattern or keep as-is since `display=swap` is already set. At minimum, ensure fonts don't block rendering.

## 7. Cache Headers for Static Assets
**File: `public/_headers`** (new file, Netlify/Vercel convention — for Lovable preview this may have limited effect, but will apply on custom domain deployment)
- Add `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`

## Summary of Files to Change
1. `src/pages/Index.tsx` — hero `<img>` replacement
2. `src/App.tsx` — lazy imports + Suspense
3. `index.html` — preconnect links
4. `src/components/home/FeaturedListings.tsx` — image dimensions + lazy loading
5. `src/components/products/ProductCard.tsx` — image dimensions + lazy loading
6. `src/components/layout/Navbar.tsx` — logo dimensions
7. `src/index.css` — move font import to HTML (optional, low impact since display=swap exists)
8. `public/_headers` — new file for cache headers

No UI/design changes. No functionality changes.

