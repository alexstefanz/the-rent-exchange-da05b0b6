## Problem

Confirmation pop-up already exists when deleting a product (AlertDialog in `ListingsPage.tsx`). The real bug: deleted products still appear in the list because `deleteProduct` is a **soft delete** (sets `deleted_at`), but `getMyProducts` does not filter out rows where `deleted_at` is set.

## Fix

In `src/features/products/productsApi.ts` → `getMyProducts`, add `.is("deleted_at", null)` to the query so soft-deleted listings disappear from "Anunțurile mele" immediately after deletion.

No other changes needed — the existing AlertDialog confirm flow stays as-is.

## Files

- `src/features/products/productsApi.ts` (1 line added in `getMyProducts`)