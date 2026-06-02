## Problemă
Când se accesează URL-ul unui produs șters, `getProductBySlug` filtrează `deleted_at IS NULL` și returnează `null`. `ProductDetail.tsx` afișează atunci mesajul generic „Produs negăsit" — identic cu cazul în care slug-ul nu a existat niciodată. Vrem o pagină dedicată care să comunice clar: anunțul a existat, dar a fost șters.

## Ce schimbăm

### 1. API nou care distinge „șters" vs „inexistent"
În `src/features/products/productsApi.ts` adăugăm:
- `getProductStatusBySlug(slug)` → returnează `{ status: "deleted" | "not_found" | "exists", product?: Product }`. Face un singur SELECT pe `products` după slug, fără filtrul `deleted_at IS NULL`, și citește coloana `deleted_at` ca să decidă starea.
- Pentru UUID, similar `getProductStatusById(id)`.

Astfel evităm două round-trip-uri și nu modificăm RLS (rândul cu `deleted_at` setat rămâne lizibil — verificăm întâi în SQL ce policy se aplică; dacă RLS ascunde produsele șterse, adăugăm o RPC `security definer` `get_product_deletion_status(slug)` care întoarce doar `{ exists boolean, deleted boolean }`, fără date sensibile).

### 2. Componentă nouă `DeletedProductNotice`
`src/components/product/DeletedProductNotice.tsx`:
- Navbar + Footer pentru consistență
- Iconiță (Trash2 / PackageX) într-un container `rounded-2xl bg-muted`
- Titlu: „Acest anunț nu mai este disponibil" / „This listing is no longer available"
- Subtitlu: „A fost șters de proprietar sau de echipa Rentli." / EN echivalent
- Două CTA-uri: „Vezi anunțuri similare" (linkează la `/categorii` sau, dacă știm categoria din produsul șters, la categoria respectivă) + „Înapoi acasă"
- Slot opțional pentru `NearbyProductsSlider` sau recomandări din aceeași categorie

Textele intră în `src/data/uxCopy.ts` sub `product.deleted.*` (RO + EN), conform regulii de bilingualism.

### 3. Integrare în `ProductDetail.tsx`
- Înlocuim apelul curent cu `getProductStatusBySlug` / `getProductStatusById`.
- După `setIsLoading(false)`:
  - `status === "exists"` → flux normal actual
  - `status === "deleted"` → render `<DeletedProductNotice />` și setăm `useSEO` cu `noindex` + status 410-equivalent în JSON-LD (Schema.org `availability: Discontinued`)
  - `status === "not_found"` → păstrăm ecranul actual „Produs negăsit"

### 4. SEO
Pe pagina „șters" setăm `<meta name="robots" content="noindex,follow">` prin `useSEO` ca Google să scoată URL-ul din index.

## Detalii tehnice
- Niciun edge function nou; eventual o singură RPC `get_product_deletion_status` dacă RLS blochează citirea rândurilor cu `deleted_at` setat (de verificat în pasul 1 înainte de implementare).
- Fără modificări la fluxul de ștergere (`deleteProduct` rămâne soft-delete cu `deleted_at`).
- Fără modificări de rutare — totul rămâne pe `/produs/:slug`.

## Fișiere atinse
- `src/features/products/productsApi.ts` (funcție nouă)
- `src/components/product/DeletedProductNotice.tsx` (nou)
- `src/pages/ProductDetail.tsx` (branching pe status)
- `src/data/uxCopy.ts` (chei noi RO/EN)
- opțional: o migrație nouă cu RPC `get_product_deletion_status`
