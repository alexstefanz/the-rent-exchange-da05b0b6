## Problem
On product page, the "Ce e inclus" accordion always shows 4 default items (from `uxCopy.productIncludes`) when the owner left `included_items` empty. Should be hidden entirely.

## Changes

1. `src/components/product/ProductIncludes.tsx`
   - Remove the `defaultItems` fallback. If `items` is empty/undefined, return `null`.

2. `src/components/product/ProductInfoAccordion.tsx`
   - Conditionally render the entire `included` AccordionItem only when `includedItems?.length > 0`.

No other consumers of `ProductIncludes` need changes (only used here).
