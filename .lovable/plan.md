## Goal
Add a city (locație) filter dropdown on the `/cauta` page, alongside category, price, and sort. Wired to the existing `localitate` URL param so it integrates with current product fetch logic.

## Changes

### 1. `src/components/search/SearchFilters.tsx`
- Extend `SearchFiltersProps` with `selectedCity: string` and `onCityChange: (v: string) => void`.
- Add a city `<Select>` in both `InlineSearchFilters` (desktop bar, between category and price) and `SearchFiltersContent` (mobile sheet, after category). Items: `"all"` → "Toate orașele" + full deduped city list from `judete` (from `@/data/romaniaLocations`), sorted RO-alphabetically with `localeCompare("ro", { sensitivity: "base" })`. SelectContent gets `max-h-[300px]` for scrolling.
- Include selectedCity in `hasActiveFilters` consideration (handled in parent — see step 2).

### 2. `src/pages/Search.tsx`
- Add local state `selectedCity` initialized from existing `localitateFilter` URL param (default `"all"`).
- Add `handleCityChange(v)` that updates state and writes/removes `localitate` in `searchParams` (replace mode).
- Pass `selectedCity` + `onCityChange` to both `<InlineSearchFilters>` and `<SearchFilters>`.
- Update `productFilters` to read from `selectedCity` (local state) instead of `localitateFilter` constant, so the dropdown drives the query directly.
- Update `hasActiveFilters` to include `selectedCity !== "all"`.
- Update `handleClearFilters` to also reset city to `"all"` and strip `localitate` from URL.

## Out of scope
- No județ-level dropdown (single city is enough and matches the existing param model).
- No new memory; no other pages.
