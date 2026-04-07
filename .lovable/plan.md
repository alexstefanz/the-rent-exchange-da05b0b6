

## Plan: Optimizare performanță încărcare imagini

### Problema identificată
Imaginile produselor sunt servite direct din Supabase Storage la dimensiunea originală (pot fi și 3-5MB fiecare). Chiar dacă există compresie la upload (max 1920px, JPEG 0.8), cardurile de produse afișează imagini de ~480x360px dar descarcă fișiere mult mai mari. Nu există nicio transformare server-side sau optimizare la afișare.

**Impactul**: Pe pagina principală se încarcă 7+ imagini la dimensiune completă simultan, ceea ce duce la timpi de încărcare mari, mai ales pe conexiuni mobile.

### Soluție propusă

**1. Supabase Image Transformations (server-side resize)**
Supabase Storage suportă transformări on-the-fly prin parametri URL. Înlocuim `getPublicUrl` cu varianta care include `transform`:
- Carduri produse (thumbnail): `width=480, quality=75`
- Gallery mobile/desktop: `width=960, quality=80`  
- Lightbox (fullscreen): URL original, fără transformare

Creez o funcție helper `getOptimizedImageUrl(url, width, quality)` care adaugă parametrii de transformare la URL-urile existente.

**2. Componente actualizate**
- `FeaturedListings.tsx` — thumbnail-uri 480px
- `ProductCard.tsx` — thumbnail-uri 480px
- `NearbyProductsSlider.tsx` — thumbnail-uri 480px
- `ProductImageGallery.tsx` — carousel 960px, lightbox la dimensiune completă
- `SeeAllCard` în FeaturedListings — thumbnail-uri mici 200px

**3. Eager loading pentru above-the-fold**
Primele 4 imagini din FeaturedListings vor avea `loading="eager"` în loc de `lazy`, pentru că sunt vizibile imediat (above-the-fold). Restul rămân `lazy`.

**4. CSS `aspect-ratio` + placeholder**
Adaug `background-color` pe containerele de imagini pentru a preveni layout shift în timpul încărcării.

### Detalii tehnice
- Funcția helper va fi în `src/lib/imageUtils.ts`
- Format: `{publicUrl}?width=480&quality=75` (Supabase transform syntax)
- Fallback: dacă URL-ul nu e din Supabase Storage, returnează URL-ul original
- Nu necesită migrare DB sau edge function nouă

### Fișiere modificate
1. `src/lib/imageUtils.ts` — nou, helper optimizare URL
2. `src/components/home/FeaturedListings.tsx` — URL-uri optimizate + eager loading
3. `src/components/products/ProductCard.tsx` — URL-uri optimizate
4. `src/components/products/NearbyProductsSlider.tsx` — URL-uri optimizate
5. `src/components/product/ProductImageGallery.tsx` — URL-uri pe dimensiuni diferite

