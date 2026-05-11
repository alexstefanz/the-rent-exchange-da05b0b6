## Adaugă imaginea produsului în emailul "Produs publicat"

Templateul `product-published.tsx` acceptă deja `productImage` și `productId`, dar funcția `approveProduct` din `src/features/admin/adminProductsApi.ts` nu le trimite — de aceea în card apare doar logoul Rentli (placeholder).

### Modificare

În `src/features/admin/adminProductsApi.ts`, în `approveProduct`:

1. Extinde `select` pentru a include și `images`:
   ```
   .select('title, slug, owner_id, images')
   ```
2. Adaugă în `templateData` câmpurile lipsă:
   - `productImage: Array.isArray(prod.images) ? prod.images[0] : undefined`
   - `productId: prod.slug || productId` (pentru ca butonul "Vezi anunțul" să ducă la URL-ul corect cu slug)

### Fișiere modificate
- `src/features/admin/adminProductsApi.ts`

Nu sunt necesare modificări la template, edge function sau migrări DB.