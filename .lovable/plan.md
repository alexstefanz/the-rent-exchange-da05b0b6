## Problem

Când chiriașul primește pop-up-ul "Cerere refuzată" și apasă "Vezi produse similare", navigarea nu deschide categoria corectă.

Cauza: RPC `get_rental_popups` returnează `category_slug = p.category`, dar `products.category` conține numele afișat (ex. "Electronice", "Jucării și Petrecere Copii"), nu slug-ul rutei (ex. `electronice`, `jucarii-petrecere-copii`). Ruta `/categorie/:slug` din `App.tsx` rezolvă slug-ul prin `getCategoryBySlug` din `src/data/categories.ts` → nu găsește categoria și afișează "Category not found".

## Soluție (doar frontend)

În `src/components/rentals/RentalPopupManager.tsx`, funcția `handleViewSimilar`:

1. Import lista locală `categories` din `@/data/categories`.
2. Convertesc `current.category_slug` (de fapt numele) în slug real căutând prin `categories` un match pe `name` sau `nameEn` (case-insensitive, trim).
3. Dacă găsesc match → `navigate('/categorie/' + cat.slug)`.
4. Altfel fallback la căutare: `navigate('/cautare?q=' + encodeURIComponent(title))`.

Nu modific RPC-ul sau backend-ul — fix-ul este pur de prezentare. Comportamentul pentru `handleViewProduct` rămâne neschimbat.

## Verificare

După implementare, simulez un refuz al unei cereri (ex. produs din "Electronice") și verific că butonul "Vezi produse similare" duce la `/categorie/electronice`.