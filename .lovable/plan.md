
# Site-wide Polish & QA Pass

A structured audit + fix sweep across the public site, authenticated areas, and admin. Goal: visual consistency, no broken links, no runtime errors.

## Scope

Public: `/`, `/categorii`, `/categorie/:slug`, `/subcategorie/:slug`, `/cauta`, `/produs/:slug`, `/cum-functioneaza`, `/despre`, `/contact`, `/faq`, `/help`, legal pages, `/auth`.
Authenticated: `/profil`, `/anunțuri`, `/rezervari`, `/mesaje`, `/favorite`, `/notificari`, `/castiguri`, `/kyc`, `/cont`, checkout flow.
Admin: dashboard, users, products, tickets, KYC, finances, withdrawals, analytics.

## Phase 1 — Discovery (no code changes)

1. **Route inventory**: parse `src/App.tsx` route list; cross-check every `<Link to=...>`, `navigate(...)`, and `to="..."` in the codebase against defined routes. Flag dead/typo routes (e.g. diacritic mismatches like `/anunțuri` vs `/anunturi`).
2. **Runtime errors**: read `code--read_runtime_errors` + `code--read_console_logs` for current preview signal.
3. **Visual sweep** at desktop (1440), tablet (834), mobile (390) using browser tools:
   - Homepage, category page, product detail, search results, checkout step 1, profile hub, rentals list, messages, admin dashboard.
   - Screenshot each, log inconsistencies (spacing, font sizes, radius, button variants, badge colors, icon sizing).
4. **Design token audit**: grep for hardcoded colors (`text-white`, `bg-black`, `#xxxxxx`, `rgb(`) inside `src/components` and `src/pages` — flag for token migration.
5. **Link 404 sweep**: collect all internal hrefs; for each unique route, simulate match via React Router config.

## Phase 2 — Categorize findings

Group into:
- **A. Broken links / 404s** (highest priority)
- **B. Runtime errors / console warnings**
- **C. Visual inconsistencies** (spacing, typography, radius, badges, button variants, icon sizes)
- **D. Hardcoded colors** violating design system
- **E. Responsive bugs** (overflow, clipped text, broken mobile layout)
- **F. A11y quick wins** (missing alt, aria-label, focus states)

## Phase 3 — Fixes

Apply fixes file-by-file, grouped by area to keep diffs reviewable:
1. Routes & links (rename hrefs, add missing redirects where legacy links exist).
2. Shared primitives: `Button`, `Badge`, `StatusBadge`, `Card`, icon containers — normalize sizes/variants.
3. Page-level polish: homepage sections, category/product cards alignment, checkout stepper, profile hub spacing.
4. Token migration: replace hardcoded colors with semantic tokens from `index.css`.
5. Responsive fixes: overflow-x, mobile padding, sticky bar safe-areas.
6. A11y: alt text, aria-labels on icon-only buttons.

## Phase 4 — Verification

- Re-run browser screenshots at 3 viewports on the same set of pages from Phase 1.
- Re-check console + runtime errors.
- Click sample of previously broken links.

## Out of scope

- New features or content changes.
- Backend, RLS, edge functions, business logic.
- Copy rewrites (only fix obviously broken strings).
- Major redesigns of any page — purely consistency/polish.

## Deliverable

A single PR-style batch of edits + a short report of what was found and fixed, grouped by category.

## Open questions before I start

1. Should the pass include **admin area** visual polish, or only the public + user-facing site?
2. Any specific page where you've already noticed problems I should prioritize?
3. OK to standardize on existing tokens (orange `#F59E0B`, Plus Jakarta Sans, 12px radius) without introducing new design tokens?
