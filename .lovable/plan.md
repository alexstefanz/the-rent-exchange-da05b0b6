

## Plan: Create 4 Legal Pages for Rentli

### Overview
Create 4 new legal pages with rewritten (not copied) content adapted for Rentli, with a unique design distinct from the source. Each page will use a consistent legal page layout with Navbar + Footer, a clean typographic design using cards and sections.

### Pages to Create

1. **Termeni și Condiții** (`/termeni-si-conditii`) - `src/pages/legal/TermsAndConditions.tsx`
2. **Politica de Confidențialitate** (`/politica-confidentialitate`) - `src/pages/legal/PrivacyPolicy.tsx`
3. **Politica de Anulare** (`/politica-anulare`) - `src/pages/legal/CancellationPolicy.tsx`
4. **Politica privind Cookie-uri** (`/politica-cookies`) - `src/pages/legal/CookiePolicy.tsx`

### Design Approach
- Hero section with gradient background (using Rentli's orange tones) and page title
- Table of contents sidebar on desktop (sticky), collapsible on mobile
- Content organized in numbered accordion sections instead of flat scrolling
- Each section in a Card with clean spacing
- "Last updated" badge at the top
- Different from source: sidebar TOC, accordion-style sections, orange accent design

### Content Strategy
All content will be rewritten for "Rentli" brand, maintaining the same legal meaning but with different phrasing. References to "RENTX S.R.L" replaced with generic "Rentli" / "platforma". Amounts and specific company details will be adapted.

### Implementation Steps

1. **Create 4 legal page components** with rewritten Romanian text, using Navbar/Footer, Card components, and accordion sections
2. **Add routes** in `App.tsx` for the 4 new pages
3. **Update Footer** to link to the legal pages (replace `#` links with actual routes, add links for privacy/cookies/cancellation)

### Technical Details
- Lazy-load all 4 pages in `App.tsx`
- Use existing UI components: `Card`, `Accordion`, `Breadcrumb`
- No new dependencies needed
- Pages are static content, no backend needed

