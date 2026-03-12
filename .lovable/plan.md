

## Plan: Add "Ce este inclus" field to product creation and edit forms

The `products` table currently has no column for included items. We need to add one, then wire it through the forms and display.

### 1. Database migration
Add a `text[]` column `included_items` to the `products` table, defaulting to an empty array:
```sql
ALTER TABLE public.products ADD COLUMN included_items text[] DEFAULT '{}';
```

### 2. Update `src/features/products/productsApi.ts`
- Add `included_items` to the `Product` interface as `included_items: string[] | null`
- Add `included_items` to `createProduct` and `updateProduct` parameters and insert/update calls

### 3. Update `src/pages/NewProduct.tsx`
- Add state `const [includedItems, setIncludedItems] = useState<string[]>([])` 
- Below the "Descriere" field, add a list-builder UI:
  - An input + "Adaugă" button to add items
  - Display added items as a list with remove buttons
- Pass `included_items` to `createProduct`

### 4. Update `src/pages/EditProduct.tsx`
- Same list-builder UI as NewProduct
- Pre-populate from `product.included_items` on load
- Pass `included_items` to `updateProduct`

### 5. Update `src/components/product/ProductIncludes.tsx`
- Accept `items` prop from product data instead of showing defaults when product has saved items
- Only show defaults when no items are saved

### 6. Update `src/pages/ProductDetail.tsx`
- Pass `product.included_items` to `<ProductIncludes items={product.included_items} />`

### Files affected
- DB migration (new column `included_items`)
- `src/features/products/productsApi.ts`
- `src/pages/NewProduct.tsx`
- `src/pages/EditProduct.tsx`
- `src/components/product/ProductIncludes.tsx`
- `src/pages/ProductDetail.tsx`

