
# Fix Search Location Filtering

## Problem Identified

The search form has a data model mismatch between counties and localities:

1. **When user selects county "Iași"**: The code passes "Iași" to `location_city` filter
2. **Database stores**: `location_city` = "Iasi" or "iasi" (city names, not counties)
3. **Query fails**: `ILIKE 'Iași'` doesn't match "Iasi" because it's doing exact case-insensitive matching, not partial matching

Additionally, the search form uses county (județ) names but the database stores city/locality names, creating a conceptual mismatch.

## Solution

### Approach 1: Add Wildcard Matching for County Search

When a county is selected but no specific locality, use `%` wildcard with the county name stripped of diacritics to catch all variations:

```text
Search.tsx (lines 29-34):
- When only judet is selected: search for products where location_city contains cities from that county
- When localitate is selected: search for exact locality match with diacritic normalization
```

### Approach 2: Normalize Diacritics (Recommended)

Add a utility function to normalize Romanian diacritics for search comparison, and use partial matching:

**Files to modify:**

1. **src/lib/inputValidation.ts** - Add diacritic normalization function
2. **src/features/products/productsApi.ts** - Normalize location filter before querying
3. **src/pages/Search.tsx** - Pass localities list when county is selected

---

## Technical Implementation

### Step 1: Add Diacritic Normalization Utility

Create a function to convert Romanian diacritics to ASCII equivalents:
- ă/â → a
- î → i  
- ș → s
- ț → t

### Step 2: Update Products API

Modify `getProducts()` to:
1. Normalize the `location_city` filter (remove diacritics)
2. Use `%` wildcard for partial matching when appropriate

```typescript
// In productsApi.ts, line 47-49
if (filters?.location_city) {
  const normalizedLocation = normalizeDiacritics(filters.location_city);
  query = query.ilike("location_city", `%${normalizedLocation}%`);
}
```

### Step 3: Update Search Page Logic

When only a county is selected (no locality), we have two options:

**Option A** - Match all localities from that county (complex):
Pass the list of localities from the selected county to the API

**Option B** - Match by county name pattern (simple, recommended):
Since most products in a county have city names that may match the county name (e.g., "Iasi" city in "Iași" county), use normalized partial matching

---

## Implementation Details

### File: src/lib/inputValidation.ts

Add new function:

```typescript
export const normalizeDiacritics = (text: string): string => {
  return text
    .replace(/[ăâ]/gi, (match) => match.toLowerCase() === match ? 'a' : 'A')
    .replace(/[î]/gi, (match) => match.toLowerCase() === match ? 'i' : 'I')
    .replace(/[ș]/gi, (match) => match.toLowerCase() === match ? 's' : 'S')
    .replace(/[ț]/gi, (match) => match.toLowerCase() === match ? 't' : 'T');
};
```

### File: src/features/products/productsApi.ts

Update the location filter in `getProducts()`:

```typescript
if (filters?.location_city) {
  const normalizedLocation = normalizeDiacritics(filters.location_city);
  // Use partial matching to handle variations
  query = query.ilike("location_city", `%${normalizedLocation}%`);
}
```

### File: src/pages/Search.tsx

The filter building logic remains the same, but now the API will handle diacritic normalization.

---

## Edge Cases Handled

| User Selection | DB Value | Result |
|----------------|----------|--------|
| County: "Iași" | "Iasi" | Match (normalized) |
| County: "Iași" | "iasi" | Match (case-insensitive) |
| Locality: "Iași" | "Iasi" | Match (normalized) |
| Locality: "Pașcani" | "Pascani" | Match (normalized) |

---

## Testing Plan

1. Select county "Iași" → Should show products with `location_city` = "Iasi"
2. Select locality "Iași" → Should show products with `location_city` = "Iasi"
3. Select county "București" → Should show products from Bucharest sectors
4. Verify category + location combo works

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/inputValidation.ts` | Add `normalizeDiacritics()` function |
| `src/features/products/productsApi.ts` | Use normalized location with partial matching |

This is a minimal fix that solves the diacritics mismatch issue without requiring database schema changes or complex multi-value filtering.
