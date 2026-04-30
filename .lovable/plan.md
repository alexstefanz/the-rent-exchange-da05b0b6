## Goal

Add full English translations to the 5 currently Romanian-only content pages, using the existing `useLanguage`/`t()` bilingual pattern already used elsewhere.

## Pages to localize

1. **FAQ** (`src/pages/FAQ.tsx`) — UI shell already uses `t()`, but the 49-item `faqData` array, the `categoryList`, and the `"Toate"` default state are still hardcoded Romanian.
2. **Terms & Conditions** (`src/pages/legal/TermsAndConditions.tsx`) — fully Romanian.
3. **Privacy Policy** (`src/pages/legal/PrivacyPolicy.tsx`) — fully Romanian.
4. **Cancellation & Refund Policy** (`src/pages/legal/CancellationPolicy.tsx`) — fully Romanian.
5. **Cookie Policy** (`src/pages/legal/CookiePolicy.tsx`) — fully Romanian.
6. **Shared `LegalPageLayout`** — hardcoded "Acasă", "Cuprins", and "Ultima actualizare:" labels.

## Approach

- Convert each page to `useLanguage()` with a `language === "en" ? ... : ...` switch on the data arrays/sections (matches existing convention in FAQ, ProductDetail, etc.).
- For legal pages: keep the `sections` array structure but build it inside the component so it can branch on `language`. Translate each section's `title` and JSX `content` (paragraphs, lists, bold labels, link labels).
- For FAQ: build a parallel `faqData_en` and `categoryList_en` (mapping each category 1:1: General, Renting, Owners, Account, Payments, Safety, Support, Legal). Switch the default `activeCategory` from `"Toate"` to `"All"` based on language. Translate the "Toate" filter pill.
- Update `LegalPageLayout` to accept either translated labels via props or use `useLanguage` directly for the 3 fixed strings.
- Preserve all existing links (to `/suport`, `/centru-asistenta`, etc.), HTML structure, GDPR article references, dates, and brand names.

## Out of scope

- No design changes, no new routes, no DB changes.
- Document dates (e.g. "28.02.2026") stay numeric — same in both languages.
- Email addresses, company name "Rentli", and external browser support links are not translated.

## Technical notes

- Files touched: `src/pages/FAQ.tsx`, `src/pages/legal/LegalPageLayout.tsx`, `src/pages/legal/TermsAndConditions.tsx`, `src/pages/legal/PrivacyPolicy.tsx`, `src/pages/legal/CancellationPolicy.tsx`, `src/pages/legal/CookiePolicy.tsx`.
- Pattern: `const { language } = useLanguage(); const sections = language === "en" ? sectionsEn : sectionsRo;`
- No new dependencies, no DB migration, no edge function. Pure client-side string work.
