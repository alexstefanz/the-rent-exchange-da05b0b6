## Issue
The city `Select` in `MobileFilterSheet` shows cities in raw data order (and capped to the first 80), so they look unsorted. The same applies to per-județ city lists in `HeroSearchForm`, `SubcategoryDetail`, and `PublishWizard`.

## Fix
Sort cities alphabetically using Romanian locale-aware `localeCompare("ro", { sensitivity: "base" })` (handles ă/â/î/ș/ț correctly). "Toate orașele" stays pinned at the top.

### Files
1. **`src/components/category/MobileFilterSheet.tsx`** — replace `judete.flatMap(j => j.localitati).slice(0, 80)` with the full deduped list sorted RO-alphabetically, then sliced if needed. Drop the 80-cap (or raise it to e.g. 500) so users can find their city; keep `max-h-[40vh]` scroll on the SelectContent.

2. **`src/components/HeroSearchForm.tsx`** — sort the `localitati` array (per selected județ) alphabetically before mapping into `SelectItem`s in both spots (lines 144 and 168).

3. **`src/pages/SubcategoryDetail.tsx`** — same sort on the `localitati` map (line 184).

4. **`src/components/publish/PublishWizard.tsx`** — sort the `cities` array (line 1028) before rendering.

### Technical note
Use a small helper inline: `[...arr].sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }))`. No changes to `romaniaLocations.ts` data source.

## Out of scope
- No change to județ ordering, no UI restyling, no search-in-dropdown feature.
