
# Mobile performance fix — target LCP ≤ 2.5s

PageSpeed mobile: **Performance 66 · FCP 3.3s · LCP 7.6s** (TBT 10ms, CLS 0). JS execution and layout are fine — this is a **resource-delivery problem**, dominated by the hero. Plan below targets LCP under 2.5s and bundle bytes down ~1.5 MB.

## Root causes found

1. **Hero eagerly fetches all 5 slides on mount.** `HeroDynamic.tsx` renders all 5 `<img>` tags inside absolute-positioned `opacity-0` divs. `loading="lazy"` is ignored because the elements are in the viewport — the browser downloads ~1 MB of hero images before the first slide even paints. Network trace already shows `hero-travel.jpg` (190 KB, 647 ms) loaded alongside the active slide.

2. **Mobile gets the desktop hero image.** `index.html` preloads `/images/banner_hero_mobile.webp` for ≤768 px, but `HeroDynamic` only references `/images/banner_hero.webp`. The mobile preload is wasted bandwidth and mobile users still pay for the desktop file. No `<picture>` / `srcset` anywhere.

3. **Hero rotation slides are JPEG**, 164–298 KB each. WebP equivalents would be ~40–60% smaller.

4. **Dead heavy assets** shipped in build:
   - `public/jocuri-console.png` 841 KB — not referenced anywhere
   - `src/assets/jocuri-console.png` 841 KB — duplicate, unused
   - `src/assets/banner_hero.png` 232 KB — replaced by webp, unused
   - `src/assets/rentli_logo.png` 357 KB — webp version (8 KB) is what Navbar imports
   - `src/assets/rentnow_logo.png` 321 KB — needs usage check
   - `src/assets/category-transport.jpg` 877 KB and `public/images/categories/transport-utilitare.jpg` 877 KB — likely the same source uncompressed

5. **`og-image.jpg` 148 KB** and `favicon.png` 52 KB are larger than necessary (cosmetic, low priority).

## Fixes (build mode)

### Phase 1 — Hero (biggest LCP win, ~60% of the gap)

1. Rewrite `HeroDynamic.tsx`:
   - Render only the **active** slide + an optional invisible `<link rel="prefetch">` for the next one inserted via effect. Drop opacity-stacked offscreen `<img>` tags.
   - Replace `<img src=...>` with `<picture>` containing a `<source media="(max-width: 768px)" srcset="...mobile.webp 1x, ...mobile@2x.webp 2x, ...mobile@3x.webp 3x">` and a desktop `<source>` / fallback for the first slide. Keep `fetchPriority="high"` only on slide 0.
2. Fix `index.html` preload to point at the actual file the LCP element uses (currently mismatched). Drop the unused preload.
3. Convert the 4 hero rotation files to `.webp` (`hero-outdoor`, `hero-events`, `hero-travel`, `hero-tools`) using `cwebp`/`sharp` at quality 80; commit alongside originals so the JPGs can be removed once references update.

### Phase 2 — Delete dead/oversized bytes

4. Delete unused files: `public/jocuri-console.png`, `src/assets/jocuri-console.png`, `src/assets/banner_hero.png`, `src/assets/rentli_logo.png`, `src/assets/rentnow_logo.png` (after `rg` confirms no imports).
5. Re-encode `public/images/categories/transport-utilitare.jpg` from 877 KB → target ≤ 120 KB WebP (resize to ≤ 1600 px wide).
6. Re-encode `og-image.jpg` to ≤ 80 KB at 1200×630.

### Phase 3 — Quick wins around the hero

7. Add `<link rel="dns-prefetch">` for the Supabase storage subdomain (product images load from there post-LCP).
8. Ensure first-paint route (`Index`) does not trigger any Supabase fetch that races the hero — quick audit of `useHomepageActivity` and featured listings to confirm they only fire post-mount.
9. Audit other heavy pages for the same eager-image pattern: `CategoryHero`, `ProductDetail` gallery, `NearbyProductsSlider`. Apply `loading="lazy"` + `decoding="async"` + explicit `width`/`height` where missing.

### Phase 4 — Verify

10. Rebuild, then re-run `browser--performance_profile` at 390×844 viewport. Targets:
    - LCP ≤ 2.5 s (from 7.6 s)
    - FCP ≤ 1.8 s (from 3.3 s)
    - Hero total bytes ≤ 130 KB on mobile (from ~1 MB)
    - Total transferred image bytes for `/` first paint ≤ 200 KB
11. Spot-check other pages (`/cauta`, `/categorie/utilaje`, `/produs/:slug`) with the profiler.

## Out of scope

- JS bundle splitting beyond what's already in `manualChunks` (TBT is 10 ms — no JS problem to fix).
- Service worker / PWA.
- Image CDN/transformer integration (would help further but adds infra; only if Phase 1–3 don't hit target).

## Open question

Want me to also **convert hero JPGs → WebP in the same pass** (small CLI run via `nix run nixpkgs#libwebp -- cwebp`), or keep originals and just stop loading the dead slides? The WebP conversion is the right long-term answer and only takes one extra step.
